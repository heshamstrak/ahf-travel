# Milestone 4 report: booking creation, inventory holds and concurrency

Status: complete. The gate is green, repeated. Milestone 5 (payments) has not been started.

Scope: `Valid Quote → Atomic Inventory Hold → Booking + BookingItem → Pending Confirmation`, and the reverse path, `Expired/Failed/Cancelled Hold → Inventory Release`. No payment gateway, no admin CRUD, no frontend integration, no email delivery. A booking's success means its inventory is held, never that it is sold or paid: nothing in this milestone writes to `soldUnits`/`bookedUnits`/`bookedTravellers`, and `paymentStatus` stays `UNPAID` throughout.

## 1. Booking endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/bookings` | Body `{ quoteId, customer: {firstName, lastName, email, phone, countryCode}, specialRequests? }`. Requires the `Idempotency-Key` header. Returns `201` with the booking. |
| GET | `/api/v1/bookings/:idOrReference` | `:idOrReference` is the UUID or the `EB-XXXXXXX` reference. `?email=` is required for a guest booking; a signed-in owner needs neither. |
| POST | `/api/v1/bookings/:idOrReference/cancel` | Body `{ email?, reason? }`. Same ownership rule as GET. |

All three accept both signed-in users and guests (`@OptionalAuth`, the same mechanism Milestone 3 added for quotes).

## 2. Booking state machine

`PENDING_PAYMENT → CANCELLED` (by the customer) or `PENDING_PAYMENT → EXPIRED` (by the hold-expiration worker). Both are guarded, single-use transitions: `WHERE status = 'PENDING_PAYMENT'`, so whichever request's `UPDATE` commits first changes the status, and the other finds nothing left to change. `BookingItem.status` follows the same two transitions (`HELD → CANCELLED` / `HELD → EXPIRED`). No other transition exists yet: `CONFIRMED`, `COMPLETED`, and the sold/paid side of `BookingItemStatus`, belong to the payment milestone.

## 3. Idempotency behaviour

- Scope: `IdempotencyKey(operation = "booking.create", key)`, unique on the pair. `quoteId` is never used as the key (a client-chosen value is required; its absence is `422 IDEMPOTENCY_KEY_REQUIRED`).
- **Same key, same request** (sequential): the stored row's `requestHash` matches, and the original response is replayed without re-running anything.
- **Same key, different request**: the hash differs, so the request gets `409 IDEMPOTENCY_KEY_CONFLICT` instead of a second attempt.
- **Simultaneous requests, same key**: the two attempts serialize on the quote row (both try to consume the same quote). The loser, finding the quote already consumed, checks whether an `IdempotencyKey` row exists under *its own* key. Postgres guarantees that if it does, the winner's whole transaction — quote consumption, booking, item, hold and the `IdempotencyKey` insert itself — is already fully committed (the loser was blocked on that very row's write lock, so unblocking it means the winner is done). The loser then returns the winner's stored response unchanged. Proven in `concurrency.e2e-spec.ts`, 5 repeated iterations, exactly one booking every time.
- **Simultaneous requests, same key, different quotes** (key reuse across logically different requests): the `IdempotencyKey` unique constraint is the final arbiter. Whichever transaction's `IdempotencyKey` insert loses the unique-constraint race is rolled back in its entirety, including a booking and hold it may have already created, and the key's original owner's response is returned (or a `409` if the hash differs). This is a documented edge case, not directly tested (it requires two different quotes under one key, which no legitimate client does), but the mechanism is the same one proven for the same-quote case.
- **Lifecycle**: `IdempotencyKey` rows are written only on success, in the same transaction as the booking (`expiresAt` = 24 hours, a code constant: this is an operational parameter, not a `Setting` a business user would tune). A failed attempt leaves no row — "a key exists only if its operation committed" (ARCHITECTURE Revision 4) — so a retry after a failure or a dropped connection simply re-evaluates the request fresh, which is safe because nothing was left half-done.

## 4. Quote consumption behaviour

A single atomic statement is the only authority:

```sql
UPDATE "Quote" SET "consumedAt" = $now
 WHERE id = $quoteId AND "consumedAt" IS NULL AND "expiresAt" > $now
 RETURNING *;
```

No `SELECT` first, no `if (quote.consumedAt === null)` in application code. A concurrent attempt on the same quote blocks on this row until the first transaction ends, then re-evaluates the `WHERE` clause against whatever was actually committed — the standard Postgres read-committed behaviour for a write-write conflict, not a special case this code has to construct. `Booking.quoteId` is additionally `UNIQUE`, so even a hypothetical bug in the guarded update could not let two bookings reference one quote; the schema itself forbids it. Different idempotency keys racing the same quote: proven in `concurrency.e2e-spec.ts` ("same quote, different idempotency keys"), 5 repeated iterations, exactly one booking every time, the loser always `409 QUOTE_ALREADY_CONSUMED`.

## 5. Inventory hold algorithm, per product

Every hold is a blind, guarded `UPDATE ... SET heldUnits = heldUnits + n`. There is no read-then-decide step: the database's own `CHECK` constraint (`held + sold/booked + blocked <= total`, from Milestone 1) is what rejects an oversold row, and a missing row is a Prisma "record not found". Both become `409 NOT_AVAILABLE` and roll back the whole transaction.

- **Hotel**: one guarded update per night, in ascending date order, against `RoomInventory(roomId, date)`. All nights succeed or the whole booking fails — proven directly in `multi-night-rollback.e2e-spec.ts` (nights 1–2 available, night 3 is not; the attempt fails and nights 1–2 are left at `heldUnits = 0`, not partially held).
- **Tour**: one guarded update against `TourSession.heldUnits`, by the requested participant count.
- **Car**: one guarded update per rental day, in ascending date order, against `CarInventory(carModelId, locationId, date)`.
- **Transfer**: one guarded update against `TransferCapacity(vehicleClassId, date)`, the V1 daily-capacity model.
- **Package**: one guarded update against `PackageDeparture.heldTravellers`. As before (Milestone 3's architecture), this does **not** reserve the package's underlying hotel, tour or transfer components — a documented V1 limitation, preserved on purpose and asserted directly in `bookings-create.e2e-spec.ts` (booking the Cairo Weekend package leaves the Marriott's own `RoomInventory` untouched).

Ascending date order for the two multi-row products (hotel, car) is deterministic and identical in every transaction, which is what prevents a deadlock between two bookings that both touch overlapping nights or days — see section 16.

## 6. Hold expiration and release

`HoldExpirationService.run()` (`src/bookings/hold-expiration.service.ts`) is the complete, tested release worker. It is not wired to a scheduler in this milestone (see section 18); `run()` is what a cron job or an operator trigger calls later.

- `holdMinutes` is copied from the quote (itself a snapshot of the `booking.holdMinutes` Setting taken at quote creation) onto the booking at creation time, and `holdExpiresAt = createdAt + holdMinutes`.
- Release is one short transaction per booking: a guarded `UPDATE "Booking" SET status = 'EXPIRED' WHERE status = 'PENDING_PAYMENT' AND "holdExpiresAt" < now() RETURNING id`, then (only if that affected a row) the same `releaseBookingItem` dispatcher cancellation uses, then the audit events, all together.
- **At most once**: the guarded `UPDATE` is the only thing that decides who performs a release. Two workers (`Promise.all([worker.run(), worker.run()])` against the same overdue booking) always result in exactly one of them reporting `expired: 1`; the inventory is decremented exactly once, never driven negative. Proven, 1 repeated pairing, in `expiration.e2e-spec.ts`.
- **Confirmed/sold inventory is never touched**: the worker only ever matches `status = 'PENDING_PAYMENT'`; nothing in this milestone produces any other status that holds inventory.
- **Cancellation vs. expiration**: both use the identical guard (`WHERE status = 'PENDING_PAYMENT'`), so a cancellation and an expiry racing on the same booking resolve exactly like two workers do — proven in `expiration.e2e-spec.ts`: the booking ends up `CANCELLED` or `EXPIRED` (never both attempted), and the room is released exactly once either way.
- Running the worker again, or running it with nothing due, is a safe no-op.

## 7. Cancellation behaviour

Only the lifecycle valid before payment integration: a booking still `PENDING_PAYMENT` can be cancelled by its owner (signed-in user) or by anyone who presents the booking's own email address. The guarded status transition, the inventory release, the `BookingItem` status update and the two audit events (`inventory.released`, `booking.cancelled`) are one transaction. An already-cancelled, already-expired, or (in a later milestone) paid booking returns `409 BOOKING_NOT_CANCELLABLE` and releases nothing a second time. No refund logic exists or is implied here.

## 8. Ownership and security

- A signed-in user's booking carries `userId`; only that user can read or cancel it.
- A guest booking (`userId = null`) is read or cancelled with the booking's own email. The reference alone is never authorization — `BOOKING_REFERENCE_PATTERN` only identifies *which* booking, the email (or session) proves the caller may see it.
- Every "wrong owner", "wrong email", and "no credential at all" case returns the same `404 NOT_FOUND`, never a `403`, so a caller cannot tell a booking exists under someone else's account.
- The public view never includes `userId`, `cancelledById`, the raw product foreign keys (`hotelId`, `roomId`, `ratePlanId`, `tourSessionId`, `carModelId`, `pickupLocationId`, `transferRateId`, `packageDepartureId`), `quoteId`, or the internal `version` counter. It does include the product snapshot's own public catalogue ids and names (hotel, room, tour, car, vehicle class, package) — the same ids the catalogue endpoints already expose. Scanned directly in `validation-and-security.e2e-spec.ts`.
- The booking reference (`src/bookings/booking-reference.ts`) is a 7-character Crockford base32 code built from the dedicated `booking_reference_seq` sequence, scrambled with a bijective 32-bit multiplicative hash so consecutive bookings do not produce consecutive-looking codes. Uniqueness follows directly from the sequence never repeating (the scramble cannot collide for distinct inputs below 2^32); `reference` is `UNIQUE` and indexed in the schema. 5 unit tests cover the format, determinism, 50,000-value collision-freedom, and non-sequential appearance.

## 9. Database changes and migrations

One migration, `20261007140242_booking_reference_and_surcharge`, applied to dev and (via the integration runner's non-destructive `migrate deploy`) to test:

- `Booking.surcharge` (`DECIMAL(12,2)`, default 0), matching the column Milestone 3 added to `Quote`.
- **A real defect found and fixed**: `Booking_total_reconciles`, from the Milestone 1 migration, was `total = subtotal - discount + tax + fee` — no surcharge term, the identical bug Milestone 3 found and fixed on `Quote`. Any booking with a non-zero surcharge (for example a young driver on a car rental) would have violated it. The old constraint is dropped and replaced with the complete identity; `Quote_total_adds_up`'s Milestone 3 counterpart was the template. Also added: `Booking_surcharge_nonnegative`.
- `booking_reference_seq`: a plain Postgres sequence, not a Prisma model (Prisma manages tables; nothing about a bare sequence needs an ORM mapping). Starts at 100,000.

No other schema change was needed: `Booking`, `BookingItem` and `IdempotencyKey` already carried every field this milestone uses (confirmed by reading the schema and the Milestone 1 migration SQL before writing any code, not from memory). The migration was created with `prisma migrate dev --create-only`, then hand-extended, then applied; it was never edited after being applied.

## 10. Concurrency test results, all five products

Real PostgreSQL 17, real concurrent HTTP requests over `supertest` against one running application (genuine separate pooled Prisma connections, not a simulation), each race repeated 5 times with a fresh fixture reset before every iteration (`test/bookings/concurrency.e2e-spec.ts`):

| Product | Resource pinned to exactly 1 free unit | Result over 5 repeats |
|---|---|---|
| Hotel | `RoomInventory` (Marriott Pyramid View King) | Exactly 1 of 2 succeeds every time; `heldUnits` is always exactly 1 afterward |
| Tour | `TourSession.heldUnits/bookedUnits` (Nile Dinner Cruise) | Exactly 1 of 2 succeeds every time |
| Car | `CarInventory` (Corolla, Cairo Airport) | Exactly 1 of 2 succeeds every time |
| Transfer | `TransferCapacity` (CAI → Cairo city centre, sedan) | Exactly 1 of 2 succeeds every time |
| Package | `PackageDeparture.heldTravellers` (Cairo Weekend) | Exactly 1 of 2 succeeds every time |

Every loser receives `409 NOT_AVAILABLE`. After every iteration the counters were asserted directly from the database (not from the HTTP response), confirming `held + sold/booked + blocked <= total` held throughout and was never read-then-written around.

## 11. Same-quote and same-idempotency-key races

Both in `concurrency.e2e-spec.ts`, 5 repeats each, with generous inventory (so only the quote/idempotency guard, not scarcity, can be the deciding factor):

- **Same quote, two different idempotency keys**: exactly one booking exists every time; the loser is `409 QUOTE_ALREADY_CONSUMED`.
- **Same idempotency key, identical request, truly concurrent**: exactly one booking exists every time, and **both** HTTP responses carry the identical booking id and body (not one success and one error) — the correct idempotent-replay contract, not just "no duplicate".

## 12. Expiration and cancellation races

In `expiration.e2e-spec.ts`:

- Two calls to `HoldExpirationService.run()` fired concurrently (`Promise.all`) against the same overdue booking: the sum of their `expired` counts is exactly 1, and the room's `heldUnits` returns to exactly 0 (not negative, proving no double release).
- A cancellation request and a worker run fired concurrently against the same overdue booking: the booking ends up in exactly one of `CANCELLED`/`EXPIRED`, and `heldUnits` is exactly 0 afterward either way.

## 13. Failure-injection rollback results

`src/bookings/failure-injection.ts` defines `BookingTransactionHooks`, a no-op in production with no environment variable, request header, or other runtime switch that could enable it outside a test. Each of the five required checkpoints (`quote_consumed`, `first_inventory_mutation`, `booking_created`, `booking_item_created`, `inventory_held`) is exercised by overriding this one provider in a test's own `TestingModuleBuilder` (`createTestAppWithHook`, `test/bookings/support.ts`) to throw at a chosen step — a mechanism that only exists inside a test process, never in the application's own module wiring.

All five tests (`failure-injection.e2e-spec.ts`) confirm, after the induced failure:
- no orphan `Booking` row,
- no `Quote` with `consumedAt` set but no booking (`consumedAt` is back to `NULL`),
- no leaked inventory hold (`heldUnits` is 0 on every affected row, including the first night of a 3-night stay that had already been held before the injected failure),
- no partial hotel stay (checked for *every* night, not only the first),
- no `AuditEvent` row for the attempt at all.

The two checkpoints inside the per-night hold loop (`first_inventory_mutation`, `inventory_held`) used a 3-night stay specifically so the test proves rollback even after one or all nights had already succeeded within the (uncommitted) transaction — the harder case, not just "nothing happened yet".

## 14. Test counts

- Unit: **73 of 73** pass (`npm test`). 63 carried over from Milestones 1–3, plus 10 new: 5 for the booking-reference encoding, 5 for the canonical request-hash used by idempotency.
- Integration: **258 of 258** pass (`node scripts/run-integration.mjs`), run twice in succession to confirm stability, against PostgreSQL 17.
  - 33 Milestone 1, 131 Milestone 2, 59 Milestone 3 — all unaffected by this milestone's code.
  - 35 new, in `test/bookings/`:
    - `bookings-create.e2e-spec.ts`: 13 (one happy path per product, ownership, idempotency, quote validity)
    - `concurrency.e2e-spec.ts`: 7 (5 "last unit" races, the same-quote race, the same-key race — each internally repeated 5 times)
    - `multi-night-rollback.e2e-spec.ts`: 2
    - `expiration.e2e-spec.ts`: 3
    - `failure-injection.e2e-spec.ts`: 5
    - `validation-and-security.e2e-spec.ts`: 5

## 15. Lint, type-check, build, migration status

| Check | Result |
|---|---|
| `npm run lint` (src, test) | 0 errors |
| `npx eslint "prisma/seed/**/*.ts"` | 0 errors |
| `npm run typecheck` | exit 0 |
| `npx prisma validate` | schema valid |
| `npx prisma migrate status` | up to date, 5 migrations |
| `npm run build` (`nest build`) | exit 0 |
| `npm test` (unit) | 73 / 73 |
| `node scripts/run-integration.mjs` (all of M1–M4) | 258 / 258, twice |

## 16. Deadlocks and performance

No deadlock was observed in any run (multiple full-suite runs, each repeating every race 5 times). The design reason: the two multi-row holds (hotel nights, car days) always process their rows in ascending date order, inside every transaction, with no exception. Two transactions that both touch an overlapping range of nights or days therefore always request their row locks in the same relative order, which is what rules out the circular-wait that causes a deadlock; it is not something the tests merely failed to trigger by luck.

No booking transaction calls an external service, sends email, or does unrelated work — every statement inside `$transaction` is a direct, short database operation (a handful of point reads/writes and up to one row per night/day for a multi-night stay). A representative guard, run for every product, is the same shape:

```sql
UPDATE "RoomInventory" SET "heldUnits" = "heldUnits" + $rooms
 WHERE "roomId" = $roomId AND "date" = $date;
```

with the CHECK constraint, not a WHERE-clause capacity test, deciding whether it is allowed. Concurrent updates to the same row serialize on Postgres's own row lock and re-evaluate against the latest committed value when unblocked — the standard read-committed behaviour this design relies on throughout, not a special mechanism built for this milestone.

One genuine pitfall surfaced during testing, not in the application but in the test suite itself: two test files that left a scarce fixture (a `TourSession` or `PackageDeparture` also read by Milestone 2's and 3's own tests) in a deliberately near-exhausted state, without restoring it afterward, caused unrelated suites to fail when the whole gate ran together — never when a file ran alone. The fix was a `restoreSharedFixtures` helper, called from every M4 test file that makes one of those fixtures scarce on purpose, resetting it back to its full pristine capacity. This is now part of the standing convention for any future test that manipulates shared inventory fixtures.

## 17. Architecture deviations

1. **Idempotency-key scope and lifecycle.** The key is scoped to `operation = "booking.create"` with a 24-hour `expiresAt`, a code constant rather than a `Setting`: it is an operational parameter (akin to a request-replay window), not a business rate someone in finance would tune.
2. **The quote-race loser's "is this my twin" check.** Rather than a separate claim/mutex row, the loser of the quote-consumption race simply looks up its own idempotency key inside the same transaction. This works because Postgres never lets it observe a half-committed winner — by the time the loser is unblocked, the winner is either fully committed or fully rolled back. It is simpler than a pre-claimed placeholder row and was arrived at after considering, and rejecting, that heavier design.
3. **No payment-method selection in this milestone.** `Booking.paymentMethod` stays `NULL` and `paymentStatus` stays `UNPAID` for every booking, including what the approved architecture describes as the pay-later path (immediate `CONFIRMED`, no card needed). Milestone 4's own instructions are explicit that booking success means held, not paid or sold, and are read here as taking precedence over that detail of the architecture document for this milestone; the pay-later confirmation path is deferred to the payment milestone, where it belongs next to the rest of `held → sold`.
4. **One `BookingItem` per booking.** Milestone 3's quotes are single-product, so a booking built from one quote has exactly one item. Multi-item "cart" checkout (several quotes combined into one booking) is not part of the approved V1 scope and is not implemented.
5. **`BookingItem.startsAt`/`endsAt` for tours and packages** are set to the same instant (the session start, or the departure date) rather than computed from the tour's duration or the package's night count, which the stored quote snapshot does not carry. This is informational only — it is never read by the hold or release logic, which always uses the room/car/transfer/package date fields directly.
6. **The hold-expiration worker is not wired to a scheduler.** See section 18.

## 18. Known limitations before payment integration

- `HoldExpirationService.run()` is complete and proven safe for multiple concurrent callers, but nothing in this codebase calls it on a schedule yet. Wiring it to a cron (in-process, e.g. `@nestjs/schedule`, or an external trigger hitting a protected endpoint) is an operational task for a later milestone; it was intentionally not added as a new dependency here.
- Package inventory still only holds the departure allotment, not its component hotel/tour/transfer stock — carried over, unchanged, from the approved V1 limitation.
- A payment method is never recorded or acted on; `held → sold`, payment success/failure, late payment, refunds, and payment idempotency are explicitly out of scope and belong to Milestone 5.
- Deposits (cars) are shown on the catalogue detail only; nothing in a booking collects or records one.
- An astronomically unlikely (1-in-4-billion-scale) booking-reference collision would surface as an unmapped 500, not a retry. Given the bijective encoding guarantees zero collisions for any two distinct sequence values below 2^32, no retry logic was added for this; it is noted here rather than silently assumed away.
- Cancellation policy text is copied onto the booking but not evaluated — there is no refund preview, because there is no refund in this milestone.
