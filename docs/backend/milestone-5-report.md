# Milestone 5 report: cash + InstaPay manual payment and booking confirmation

No online payment gateway is implemented or referenced anywhere in this milestone. The only
supported methods are `CASH` and `INSTAPAY`, both settled manually.

## 1. Schema and migrations

Three new, additive migrations, none editing a previously applied one:

- `20261007161727_cash_instapay_payment_enums` — adds `CASH`/`INSTAPAY` to `PaymentMethod`,
  `PENDING_VERIFICATION`/`REJECTED` to `PaymentState`, and `PAYMENT_PROOF` to `MediaOwnerType`.
  Split into its own migration because PostgreSQL will not let a newly added enum value be
  referenced (by the CHECK constraints below) in the same transaction that adds it.
- `20261007161728_cash_instapay_payment_fields` — adds `Payment.transferReference`,
  `proofSubmittedAt`, `reviewedAt`, `reviewedById`, `rejectionReason`; widens `providerName` to
  nullable (meaningless for a manual method); adds `Payment_rejection_reason_required` (a rejected
  payment must carry a reason) and `Payment_manual_states_instapay_only` (`PENDING_VERIFICATION`/
  `REJECTED` can only occur for `INSTAPAY`) CHECK constraints; adds an index on
  `(status, proofSubmittedAt)` for the admin review queue.
- `20261007171200_widen_payment_idempotency_key` — widens `Payment.idempotencyKey` from
  `VARCHAR(64)` to `VARCHAR(100)`, matching `IdempotencyKey.key`'s width, so a client-supplied
  InstaPay submission key is never silently rejected for length before business logic sees it.

No changes were needed to `Booking`, `BookingStatus`, `BookingItemStatus` or any inventory table:
`BookingStatus.CONFIRMED` and `BookingItemStatus.CONFIRMED` already existed from the approved
schema, and `PaymentStatus.PAY_LATER`/`PENDING`/`PAID`/`UNPAID` already cover every state this
milestone needs at the booking level. `Media` itself needed no column changes — only the new
`PAYMENT_PROOF` owner type — since `Media.ownerId` was already a polymorphic reference checked in
the service layer, the same pattern every other owner type already used.

A reasoned deviation from the originally proposed `Payment` shape: that model was built entirely
around a card/provider gateway (`providerName`, `providerPaymentId`, card brand/last4). Milestone 5
explicitly forbids any such gateway, so `providerName`/`providerPaymentId` are simply unused (left
`null`) for `CASH`/`INSTAPAY` rather than removed, keeping the migration additive and the schema
forward-compatible with a future real gateway.

## 2. Payment states

`PaymentMethod`: `CASH`, `INSTAPAY` (plus the pre-existing, unused-in-V1 `CARD`/`PAY_LATER`).

`PaymentState` (on the `Payment` row): `PENDING` (CASH, not yet collected, or InstaPay before
review), `PENDING_VERIFICATION` (InstaPay, awaiting admin), `SUCCEEDED` (approved InstaPay, or cash
recorded as collected), `REJECTED` (InstaPay, admin rejected, reason required by CHECK).

`PaymentStatus` (the booking-level summary): `UNPAID` before any method is selected, `PENDING`
while an InstaPay proof awaits admin review, `PAY_LATER` once CASH is selected and the booking is
confirmed (explicitly not `PAID`), `PAID` once InstaPay is approved or an admin later records cash
as collected.

Each InstaPay submission is its own `Payment` row (the schema's existing "a retry is a new Payment,
not a mutation" design, extended unchanged to manual proofs): a rejected submission is kept as a
permanent record with its reviewer and reason, and a later resubmission creates a new row rather
than overwriting it.

## 3. Cash flow

`POST /bookings/:idOrReference/payment/cash` (owner or guest, by email). One transaction: creates
the `Payment` row (`PENDING`, amount/currency from the booking), guards the booking's
`PENDING_PAYMENT → CONFIRMED` transition, converts every booking item's inventory `held → sold`,
and audits `payment.cash_selected`, `booking.confirmed`, `inventory.sold`. The `Payment` row is
never marked `SUCCEEDED` by this call — cash is explicitly "not yet collected" per the brief.

A separate admin-only action, `POST /admin/payments/:id/cash-collected`, later records the cash as
actually received: guarded `PENDING → SUCCEEDED` on the `Payment`, and a guarded
`PAY_LATER → PAID` on the booking's `paymentStatus` (the booking's own `status` stays `CONFIRMED`
throughout — only the payment summary changes). Both guards make repeating the action a clean,
audited no-op rather than a double-collection.

## 4. InstaPay flow

`GET /payments/instapay-instructions` (public) returns the recipient name, handle and instructions
text from the `Setting` table (`payment.instapay` key), never hard-coded in a controller or the
frontend.

`POST /bookings/:idOrReference/payment/instapay` (multipart, `Idempotency-Key` required) accepts a
`transferReference` field and a `proof` file. One transaction creates the `Payment` row
(`PENDING_VERIFICATION`) and the `Media` row, writes `payment.instapay_submitted`, and records the
idempotency key — the same create-booking-style idempotency pattern as Milestone 4 (same key + same
content replays; same key + different content conflicts; a new attempt after a rejection uses a new
key). The booking itself stays `PENDING_PAYMENT`; nothing is confirmed yet.

Admin review (role-guarded, see §6): **approve** guards `PENDING_VERIFICATION → SUCCEEDED` on the
payment, then — in the same transaction — guards the booking's `PENDING_PAYMENT → CONFIRMED` and
converts inventory `held → sold`. If the booking guard fails (expired or cancelled first), the
whole transaction, including the payment approval, rolls back; approval is never retried as a
silent reacquisition. **Reject** (reason required) guards `PENDING_VERIFICATION → REJECTED` only —
it never touches the booking or its inventory, so the hold remains valid and the customer can
submit a new proof (a new `Payment` row) until it expires.

## 5. Receipt and storage implementation

`validateProofFile` (`src/payments/file-validation.ts`) accepts only JPEG/PNG/WEBP/PDF, identified
by sniffing magic bytes (`FF D8 FF`, the PNG signature, `RIFF…WEBP`, `%PDF-`) — never by the
client's `Content-Type` header or the uploaded filename — and enforces a configurable size ceiling
(`PAYMENT_PROOF_MAX_BYTES`, default 5 MB; Multer itself caps raw uploads at 20 MB as a coarse
backstop before that check even runs).

Storage sits behind a `FileStorage` interface (`src/payments/storage.ts`): `save`/`read` by a
server-generated object name (`payment-proofs/<uuid>.<ext>` — never derived from the client's
filename). `LocalFileStorage` is the only implementation, writing under `PAYMENT_PROOF_DIR`
(default `var/payment-proofs`, gitignored). Nothing mounts that directory as static content — the
application registers no static-file middleware at all — so the only way to read a file back is
through the access-controlled proof endpoint. Swapping in S3-compatible storage later means writing
one new class and changing the DI binding in `payments.module.ts`; nothing else changes.

Metadata is stored as a `Media` row (`ownerType: PAYMENT_PROOF`, `ownerId: payment.id`), reusing the
approved Media abstraction exactly as instructed. No public catalogue endpoint ever queries
`ownerType = PAYMENT_PROOF`, so reusing the shared table carries no exposure risk.

`GET /payments/:paymentId/proof` streams the file after checking that the caller is the booking's
owner (signed-in match or guest email match) or holds `ADMIN`/`FINANCE`; anyone else gets 404, not
403, so a guessed id never confirms a payment's existence.

## 6. Admin endpoints

All under `/admin/payments`, guarded by the existing (now, for the first time, actually used)
`RolesGuard` with `@Roles(Role.ADMIN, Role.FINANCE)`:

- `GET /admin/payments/instapay?status=&page=&pageSize=` — paginated queue, oldest submission first.
- `GET /admin/payments/:paymentId` — full detail: payment, proof metadata (mime type, size — never
  the raw storage key), and a summary of the linked booking.
- `POST /admin/payments/:paymentId/approve`
- `POST /admin/payments/:paymentId/reject` (body: `reason`)
- `POST /admin/payments/:paymentId/cash-collected`

No Admin frontend was built, per the stop condition.

## 7. Hold expiration scheduler

`HoldExpirationScheduler` (`src/bookings/hold-expiration.scheduler.ts`) wires the Milestone 4
`HoldExpirationService.run()` to a plain `setInterval` (`HOLD_SCHEDULER_INTERVAL_MS`, default 60 s),
gated by `HOLD_SCHEDULER_ENABLED` (default `true`; forced `false` in tests, which drive expiration
directly instead of waiting on a timer). No `@nestjs/schedule`, no queue, no Redis: the only
authority on whether a given booking's hold is actually released is the guarded
`WHERE status = 'PENDING_PAYMENT' AND holdExpiresAt < now` transition already proven in Milestone 4.
A per-instance "already running" flag skips an overlapping tick on *that* instance purely to avoid
redundant scans; it is an efficiency measure, not the correctness mechanism — two separate instances
(or two scheduler objects, as the tests construct) racing on the same row are made safe by the
database guard alone.

A genuine robustness gap was found and fixed while testing this: `HoldExpirationService.run()`
previously let one candidate's unexpected failure abort the whole batch scan, silently skipping
every other legitimately overdue booking in that call (and the next, if the same bad candidate
sorted first again). `run()` now wraps each candidate in its own try/catch, counts failures
separately, and always finishes the batch (`see §11`).

## 8. `held → sold` implementation

`src/bookings/inventory-confirm.ts` adds `confirmHotel`/`confirmTour`/`confirmCar`/
`confirmTransfer`/`confirmPackage`, mirroring Milestone 4's `holdX`/`releaseX` shape exactly: each
is a guarded `UPDATE` moving `heldUnits → soldUnits` (rooms) or `heldUnits → bookedUnits`
(tours/cars/transfers) or `heldTravellers → bookedTravellers` (packages), relying on the same
`heldUnits >= 0` CHECK constraints Milestone 1 already enforces as the non-negativity guard, and on
the capacity CHECK (`held + sold/booked + blocked <= total`) being trivially preserved since the
total held+sold+blocked sum never changes — only which bucket a unit sits in. Hotel and car
conversions process every night/day in the same deterministic ascending-date order as their holds,
inside the one transaction that also confirms the booking, so a multi-night/multi-day conversion is
all-or-nothing (proved in §10 by corrupting one night's counter directly and observing full
rollback).

The primary guard against reaching this code more than once for a given booking is the booking's
own guarded `PENDING_PAYMENT → CONFIRMED` transition, which runs first in the same transaction.

## 9. Security and ownership

Customer-facing endpoints (cash selection, InstaPay submission, proof download) use the same
ownership rule as Milestone 4: a signed-in owner by `userId`, or a guest by exact, case-insensitive
email match against the booking — anyone else gets 404. Admin review endpoints require `ADMIN` or
`FINANCE` via `RolesGuard`, which Milestone 4 had defined but never actually applied to a route
before this milestone. No endpoint ever reveals another customer's email, reference, transfer
reference or proof through id guessing; every lookup by id that fails ownership or role returns a
plain 404.

## 10. Concurrency test results

All of the following ran against real PostgreSQL (`test/payments/concurrency.e2e-spec.ts`,
`scheduler.e2e-spec.ts`, `multi-night-confirm-rollback.e2e-spec.ts`), most repeated 5× with exact
inventory-counter assertions after every repeat:

- Two simultaneous CASH confirmations on the same booking: exactly one 201, one 409; exactly one
  `Payment` row; inventory held exactly once, sold exactly once.
- Two simultaneous admin InstaPay approvals of the same payment: exactly one 201, one 409.
- InstaPay approval racing hold expiration, and CASH confirmation racing hold expiration: the
  booking ends up `CONFIRMED` (with the payment `SUCCEEDED`/inventory sold) or `EXPIRED` (payment
  left at `PENDING_VERIFICATION`, inventory released) — never both, never neither; `heldUnits` is
  always 0 afterward either way.
- Cancellation racing CASH confirmation: ends `CANCELLED` or `CONFIRMED`, never both; `heldUnits`
  settles at 0 exactly once.
- Two simultaneous identical InstaPay submissions with the same idempotency key: both resolve to
  the same `Payment` id; exactly one row created.
- Two simultaneous `cash-collected` admin actions: exactly one 201, one 409.
- `held → sold` exercised for all five product types, each asserted to zero `heldUnits` and an
  incremented `soldUnits`/`bookedUnits`/`bookedTravellers` (`cash.e2e-spec.ts`).
- Multi-night hotel confirmation proved all-or-nothing by corrupting one night's hold directly and
  observing every other night, the booking and the payment all fully roll back.
- Scheduler overlap: two independently constructed `HoldExpirationScheduler` instances ticking
  concurrently over the same overdue booking expire it exactly once; a single instance ticked twice
  at once runs once and cleanly skips the other; a `CONFIRMED` booking is never expired even once
  its original deadline has long passed.

"Repeated admin approval" and "repeated cash-collected" (sequential, not concurrent) are covered in
`admin-review.e2e-spec.ts`: a second call after the first succeeded returns a clean 409
(`PAYMENT_NOT_REVIEWABLE` / `PAYMENT_NOT_COLLECTIBLE`), never a double effect.

## 11. Failure-injection results

`PaymentTransactionHooks` (`src/payments/failure-injection.ts`) mirrors Milestone 4's mechanism
exactly — a no-op in production, overridden only inside a test's own `TestingModuleBuilder`. Five
checkpoints, each proved to roll back completely (no `Payment` row, booking still
`PENDING_PAYMENT`, inventory still held, no partial audit trail):

1. Right after the `Payment` row is created (before the booking is touched).
2. Right after the booking is confirmed (before any inventory converts).
3. After the first of several nights/days converts (multi-row case).
4. After every row converts, before the audit trail completes.
5. Between the InstaPay `Payment` row and its `Media` metadata row.

## 12. Test counts

- Unit: 79 (73 carried over from Milestones 1–4, unchanged, + 6 new in `file-validation.spec.ts`).
- Integration: 307 (258 carried over, unchanged, + 49 new across 8 files under `test/payments/`:
  `cash` 8, `instapay` 11, `admin-review` 7, `proof-access` 7, `multi-night-confirm-rollback` 1,
  `failure-injection` 5, `scheduler` 3, `concurrency` 7).
- Full integration suite run three times consecutively on a clean database: 307/307 every time.

## 13. Lint, type-check, build, migration status

- `npm run lint` — clean.
- `npm run typecheck` — clean.
- `npm run build` (`nest build`) — clean.
- `npx prisma validate` — schema valid.
- `npx prisma migrate status` — both `egypt_beyond_dev` and `egypt_beyond_test` up to date, 8
  migrations applied, none pending.

## 14. Architecture deviations

- `Payment.providerName` widened from `NOT NULL` to nullable (meaningless for a manual method;
  additive, not destructive).
- `Payment.idempotencyKey` widened from `VARCHAR(64)` to `VARCHAR(100)` to match the client-facing
  `Idempotency-Key` header's own validated length, avoiding a silent length-mismatch rejection.
- Two new CHECK constraints added beyond the original proposal (`Payment_rejection_reason_required`,
  `Payment_manual_states_instapay_only`) — small correctness additions in the same spirit as
  Milestone 1's existing invariant constraints, not a change of approach.
- The hold-expiration scheduler uses a plain in-process `setInterval`, not `@nestjs/schedule`,
  keeping the dependency footprint at zero for a mechanism whose correctness comes entirely from the
  database guard, not from the timer.
- `HoldExpirationService.run()` was hardened to continue past a single candidate's failure instead
  of aborting the batch — a correctness-adjacent robustness fix made during this milestone's own
  testing, not a deviation from any explicit instruction.

## 15. Known limitations

- `CARD` and `PAY_LATER` remain in `PaymentMethod`/`PaymentStatus` as reserved, unused values; no
  code path creates a `CARD` payment or an online-gateway integration of any kind, per the brief.
- Orphaned proof files: if the database transaction that would record a `Payment`+`Media` row fails
  or rolls back *after* the file has already been written to local storage, that file is never
  referenced by any row and is unreachable through the API, but nothing currently garbage-collects
  it from disk. Acceptable for V1 local storage; worth a periodic sweep once object storage is wired
  in.
- The admin InstaPay queue has no filter beyond `status`; finding a specific customer's submission
  means paginating (reviewed up to 50 per page) rather than searching by email or reference.
- No webhook, email or other notification is sent to the customer on approval/rejection; the
  customer only learns the outcome by re-fetching the booking or being told through some other
  (not-yet-built) channel.
- `Media.width`/`height` are stored as `0` for proof uploads (meaningless for a PDF and not computed
  even for an image receipt); this is cosmetically odd in the shared table but not read by anything.

Stopping here, as instructed: no Admin frontend, no frontend/backend integration, and no Milestone 6
work has been started.
