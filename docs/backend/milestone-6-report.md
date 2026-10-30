# Milestone 6 report: Admin Management APIs + Admin Dashboard

All stages (A–E) from the execution plan are complete. No Prisma schema or migration changes were
needed — every admin feature is built entirely on the schema Milestones 1–5 already established.

## 1. Features implemented

- Admin authentication reusing the existing `/auth/login` / `/auth/refresh` / `/auth/logout`
  endpoints and JWT infrastructure; a new `/admin/profile` endpoint; staff provisioning
  (`POST /admin/staff`, ADMIN-only).
- Admin dashboard: live booking/catalogue/payment counts, a financial summary that keeps confirmed
  booking value distinct from money actually collected, recent bookings, pending InstaPay reviews.
- Full CRUD + publish/unpublish for destinations, locations, cancellation policies, hotels, rooms,
  rate plans, tours, tour sessions, car models, transfer vehicle classes, transfer rates, packages
  and package departures.
- Guarded, atomic inventory/capacity editing for room inventory, car inventory, transfer capacity,
  tour session capacity and package departure capacity — every one rejects a change that would fall
  below units already held, sold/booked or blocked, all-or-nothing across a date range.
- Admin media upload for public catalogue images (reusing the Media abstraction and a new
  `FileStorage`-backed local implementation), with an unauthenticated serving route standing in for
  a CDN origin in development.
- Admin booking management: paginated/searchable/filterable list, full detail (items, payments,
  audit history), admin-initiated cancellation through the existing guarded booking service.
- Admin settings: an explicit allowlist of editable `Setting` keys, including InstaPay instructions,
  which the public InstaPay-instructions endpoint reflects immediately.
- Cash collection recording, reusing Milestone 5's `markCashCollected` operation unchanged.
- A responsive Next.js admin interface (`/admin/*`) wired to the real backend end-to-end — verified
  by a live smoke test against the running dev server and database, not just integration tests.

Payment review (InstaPay approve/reject, cash collection) already existed as of Milestone 5
(`AdminPaymentsController`, `/admin/payments/...`) and is reused unchanged — not duplicated.

## 2. Admin API endpoints

All under `/api/v1/admin/...` unless noted, guarded by the existing `RolesGuard`/`@Roles(...)` on
top of the global `JwtAuthGuard`.

| Area | Endpoints | Roles |
|---|---|---|
| Profile | `GET /admin/profile` | any staff role |
| Staff | `GET,POST /admin/staff` | ADMIN |
| Dashboard | `GET /admin/dashboard` | ADMIN, FINANCE |
| Destinations | `GET,POST /admin/destinations`, `GET,PATCH,DELETE /admin/destinations/:id`, `PATCH /admin/destinations/:id/status` | ADMIN |
| Locations | same shape under `/admin/locations` | ADMIN |
| Cancellation policies | `GET,POST /admin/cancellation-policies`, `GET,PATCH /admin/cancellation-policies/:id` | ADMIN |
| Hotels | `GET,POST /admin/hotels`, `GET,PATCH,DELETE /admin/hotels/:id`, `PATCH /admin/hotels/:id/status` | ADMIN |
| Rooms | `GET,POST /admin/hotels/:hotelId/rooms`, `GET,PATCH,DELETE /admin/hotels/:hotelId/rooms/:roomId`, `PATCH .../status` | ADMIN |
| Rate plans | `GET,POST /admin/hotels/:hotelId/rooms/:roomId/rate-plans`, `GET,PATCH .../:ratePlanId`, `PATCH .../status` | ADMIN |
| Room inventory | `GET,PUT /admin/hotels/:hotelId/rooms/:roomId/inventory` (date range) | ADMIN |
| Tours | `GET,POST /admin/tours`, `GET,PATCH,DELETE /admin/tours/:id`, `PATCH /admin/tours/:id/status` | ADMIN |
| Tour sessions | `GET,POST /admin/tours/:tourId/sessions`, `GET,PATCH /admin/tours/:tourId/sessions/:id`, `PATCH .../capacity`, `PATCH .../status` | ADMIN |
| Car models | `GET,POST /admin/cars`, `GET,PATCH,DELETE /admin/cars/:id`, `PATCH /admin/cars/:id/status` | ADMIN |
| Car inventory | `GET,PUT /admin/cars/:carModelId/inventory` (date range) | ADMIN |
| Transfer vehicle classes | `GET,POST /admin/transfer-vehicle-classes`, `GET,PATCH /admin/transfer-vehicle-classes/:id` | ADMIN |
| Transfer rates | `GET,POST /admin/transfer-rates`, `GET,PATCH /admin/transfer-rates/:id` | ADMIN |
| Transfer capacity | `GET,PUT /admin/transfer-vehicle-classes/:id/capacity` (date range) | ADMIN |
| Packages | `GET,POST /admin/packages`, `GET,PATCH,DELETE /admin/packages/:id`, `PATCH /admin/packages/:id/status` | ADMIN |
| Package departures | `GET,POST /admin/packages/:packageId/departures`, `GET,PATCH /admin/packages/:packageId/departures/:id`, `PATCH .../capacity`, `PATCH .../status` | ADMIN |
| Media | `POST /admin/media`, `PATCH,DELETE /admin/media/:id`; public `GET /media/*key` (unauthenticated, serves public catalogue images only) | ADMIN (upload/edit) |
| Settings | `GET /admin/settings`, `PATCH /admin/settings/:key` (allowlisted keys only) | ADMIN |
| Bookings | `GET /admin/bookings` (search/filter/paginate), `GET /admin/bookings/:idOrReference`, `POST /admin/bookings/:idOrReference/cancel` | ADMIN, FINANCE, SUPPORT (read); ADMIN, SUPPORT (cancel) |
| Payments (Milestone 5, unchanged) | `GET /admin/payments/instapay`, `GET /admin/payments/:id`, `POST /admin/payments/:id/approve\|reject\|cash-collected` | ADMIN, FINANCE |

Every mutation is validated via class-validator DTOs, whitelisted (unknown fields rejected),
paginated where it lists rows, and returns RFC 9457 problem+json on error via the existing
`ProblemFilter`.

## 3. Admin frontend routes

`/admin/login`, `/admin` (dashboard), `/admin/destinations`, `/admin/hotels` (+ `/admin/hotels/:id`
with rooms, rate-plan creation and the inventory-range editor), `/admin/tours` (+ `/admin/tours/:id`
with sessions and capacity editing), `/admin/cars`, `/admin/transfers`, `/admin/packages` (+
`/admin/packages/:id` with departures and capacity editing), `/admin/bookings` (+
`/admin/bookings/:id`), `/admin/payments`, `/admin/settings`. All real API calls (`NEXT_PUBLIC_API_URL`,
default `http://localhost:4000/api/v1`) — no mock data anywhere under `/admin`.

The customer-facing `Navbar`/`Footer` now return `null` on any `/admin/*` path (a two-line,
backward-compatible change to each — every non-admin route is pixel-identical to before) so the
admin dashboard has its own sidebar/top-bar chrome instead of the customer site's.

## 4. Database migrations

None. Every M6 feature — CRUD, publish/unpublish, guarded inventory edits, media, settings, staff,
booking search — is built entirely on the schema Milestones 1–5 already created. `docs/backend/schema.prisma`
is unchanged and confirmed still in sync with `backend/prisma/schema.prisma`.

## 5. Authentication and authorization

Reused, not rebuilt: the same JWT access/refresh pair, the same `RolesGuard`/`@Roles()` decorator
from Milestone 1 (now exercised by real routes for the first time). `/auth/register` still never
sets a role (always `CUSTOMER`), so there is no path from the public internet to a staff account.
The only way a staff account is created is `POST /admin/staff`, itself ADMIN-only — confirmed by a
test that an escalation attempt through public registration never produces anything but a
`CUSTOMER` row (or is rejected outright by whitelist validation). A single development admin
(`admin@egyptbeyond.example`) is seeded idempotently, gated to non-production
(`NODE_ENV !== "production"`), so the dashboard is reachable immediately after `npm run seed`.

## 6. Catalogue CRUD coverage

Full CRUD + publish/unpublish for destinations, locations, hotels, rooms, rate plans, tours, car
models, transfer vehicle classes/rates, and packages. Nested inventory/capacity resources (room
inventory, car inventory, transfer capacity, tour sessions, package departures) have their own
guarded endpoints. Deletion is a soft delete (`deletedAt` + `status: ARCHIVED`) everywhere the schema
has that column; `CancellationPolicy` and `RatePlan` have none, so they use status/archival only,
documented in code rather than silently omitted.

Delete guards: a destination cannot be removed while any active hotel, tour, package or location
still references it; a hotel/tour/car model cannot be removed while any `HELD` or `CONFIRMED`
`BookingItem` still references it. Both are proven in `test/admin/catalogue-crud.e2e-spec.ts`.

## 7. Inventory safety verification

This was treated as the milestone's critical requirement. Every capacity/total write goes through a
single atomic, guarded UPDATE/UPSERT (`src/admin/common/guarded-capacity.ts`) — never a read, then
compute in Node, then write. The guard is baked into the SQL's own `WHERE`/`ON CONFLICT ... WHERE`
clause (`heldUnits + soldUnits + blockedUnits <= newTotal`, or the tour/package equivalent), so
Postgres itself refuses a write that would violate `held + sold/booked + blocked <= total`; a
rejected write changes nothing. A multi-date room/car inventory update is wrapped in one
transaction, so a failure partway through any date in the range rolls back every date in that same
call, not just the failing one.

Proven in `test/admin/inventory-safety.e2e-spec.ts`:
- Lowering a room's total below what is already held is rejected and leaves the row untouched.
- Raising a room's total across a date range succeeds atomically.
- Two concurrent admin edits to the same room/date are serialised by Postgres; the counters are
  never corrupted or torn.
- Lowering a tour session's capacity below seats already held/booked is rejected.
- Changing a rate plan's price never alters an already-created booking's stored total — this holds
  structurally, with no extra guard needed, because `Booking.total` is copied from the immutable
  `Quote` snapshot (Milestone 3) at booking-creation time and is never re-read from the rate plan
  afterward.

## 8. Booking management

`/admin/bookings` supports pagination, search by reference (case-insensitive partial match),
filtering by status and by product type, and a date range on `createdAt`. The detail view includes
customer/guest information, the full pricing breakdown, every `BookingItem` with its
hold/confirm/cancel status, every `Payment` row, and the complete `AuditEvent` history for that
booking.

Cancellation is a **new**, additive method on the existing `BookingsService`
(`adminCancel`), not a second implementation: it calls the exact same guarded
`guardedCancel`/`releaseBookingItem`/`updateBookingItemsStatus` sequence as the Milestone 4 customer
cancel path, inside the same transaction shape, with two differences only — no ownership check (an
admin can act on any booking, proven by cancelling a booking it does not own), and the audit actor
and `cancelledByType` are `ADMIN` instead of `USER`/`GUEST`, so the trail always shows who really
acted. There is no manual status field an admin can set directly; the only mutation path is this
guarded transition.

## 9. Cash/InstaPay management

InstaPay review (list, detail with proof metadata, approve, reject with a reason) is Milestone 5's
`AdminPaymentsController`, used as-is — no second approval flow was built. Cash collection reuses
Milestone 5's `markCashCollected`, exposed from the booking detail page (shown only for a `CASH`
payment still `PENDING`). Neither flow was changed in this milestone beyond what was already tested
in Milestone 5.

## 10. Media upload implementation

`POST /admin/media` (multipart) validates the file by sniffing magic bytes (JPEG/PNG/WEBP only,
the same discipline as Milestone 5's InstaPay validator, never trusting the client's `Content-Type`
or filename), confirms the owner row actually exists (`Media.ownerId` has no foreign key — this is
the only integrity check available for it), generates a server-side object name, and stores the
file through a `FileStorage`-typed `LocalPublicMediaStorage` (same interface Milestone 5 defined for
payment proofs, a different implementation and directory). `PAYMENT_PROOF` is explicitly rejected
as an owner type through this endpoint — proofs are created only by the payments module's own
InstaPay submission flow. Setting a new cover image unsets the previous one for that owner inside
one transaction. Public images are served back by an unauthenticated route
(`PublicMediaController`), standing in for a CDN/object-storage origin in development; private
InstaPay receipts are still served only through Milestone 5's access-controlled endpoint — the two
are never conflated.

## 11. Tests and results

- Backend unit: 79 (unchanged from Milestone 5 — no new pure-unit logic was added this milestone).
- Backend integration: **356** (307 carried over from Milestones 1–5, unchanged, + **49** new across
  six files under `test/admin/`): `auth` 5, `catalogue-crud` 17, `inventory-safety` 5, `bookings` 8,
  `media` 6, `settings-and-staff` 8.
- Full integration suite run clean three consecutive times on a freshly reset test database.
- Coverage includes: unauthenticated/wrong-role admin access, privilege escalation via public
  registration, IDOR-style IDOR checks (FINANCE blocked from cancelling, a non-owning admin still
  allowed to cancel by design), unsafe file upload (wrong content, wrong owner type, non-admin),
  invalid inventory changes (both the single-write and the concurrent-write case), active-booking
  deletion protection, payment approval/cash-collection authorization (Milestone 5, re-confirmed
  unchanged), booking cancellation via the guarded path, and database rollback on a rejected
  capacity write.
- Two genuine cross-suite test-fixture leaks were found and fixed during this milestone: an admin
  test that published a throwaway destination/tour for a capacity test without unpublishing it
  afterward (which broke `catalogue/destinations.e2e-spec.ts`'s exact-count assertions), and a media
  test that uploaded images against the seeded Marriott Mena House hotel instead of a throwaway one
  (which broke `catalogue/hotels.e2e-spec.ts`'s exact gallery-length assertion). Both are now fixed
  by using dedicated, disposable fixtures, consistent with the `restoreSharedFixtures` discipline
  already established in Milestones 4–5.
- Frontend: no test runner is configured in this project (`package.json` has no test script), so no
  new frontend tests were added; this is a pre-existing condition, not something this milestone
  introduced. A live end-to-end smoke test was run instead: built the backend, started it against
  the real dev database, and confirmed login → `/admin/profile` → `/admin/dashboard` all succeed
  with real seeded data.

## 12. Build results

- Backend: `lint`, `typecheck`, `build` (`nest build`), `prisma validate`, `prisma migrate status`
  (dev and test) all clean.
- Frontend: `lint` and `build` (`next build`) both clean, including the 13 new `/admin/*` routes.
  Two **pre-existing** configuration gaps were fixed so these gates are meaningful: the frontend's
  `tsconfig.json`/`eslint.config.mjs` had no exclusion for the sibling `backend/` project (a NestJS
  app with its own lint/typecheck), so both tools were sweeping up backend source and compiled
  `dist/` output; both now explicitly exclude `backend/`. Neither change alters any compiled output
  or runtime behaviour.

## 13. Known limitations

- Rate plan management has a working, tested API but no dedicated admin UI page (room-level CRUD
  and inventory are in the UI; rate plans are reachable only via the API in this milestone).
- Room/hotel/tour/package image galleries have upload, cover-selection and delete wired through the
  API and proven in tests, but no in-page gallery UI component (upload is reachable via the generic
  `POST /admin/media` endpoint, not yet surfaced as a widget on the hotel/tour/package detail
  pages).
- No drag-and-drop image reordering UI; `sortOrder` is settable via the API (`PATCH /admin/media/:id`)
  but there is no frontend control for it yet.
- The settings page exposes InstaPay instructions and the booking hold duration; `quote.ttlMinutes`,
  `currency.display` and `booking.guestCheckoutEnabled` are allowlisted and readable/writable on the
  backend but have no dedicated form control in the UI yet.
- Dashboard financial totals are scoped to the platform's base currency (EGP); a booking settled in
  another currency is not folded into the headline sums (documented, not silently wrong — the
  dashboard service comment states this explicitly).
- "Total transfers" on the dashboard counts active `TransferRate` rows (sellable routes), the
  closest transfer-side equivalent of a hotel/tour/car/package listing; this is a judgement call
  worth confirming matches what stakeholders expect to see.
- No frontend automated tests: this repository has no test runner configured for the Next.js app at
  all (pre-existing, not introduced here). Critical flows were instead verified through backend
  integration tests plus one live end-to-end smoke test against the real running stack.

## 14. Deferred features

- Per-day room/car rate overrides (`RoomRate`) have no admin UI or dedicated endpoint; `RatePlan.basePricePerNight`
  already provides a working, tested pricing lever without this added complexity.
- Bulk/CSV import of catalogue data.
- Audit log browsing UI (the data is fully captured and visible on a booking's own detail page; a
  dedicated cross-entity audit log page was not built).
- Notification/email on InstaPay approval or rejection (unchanged from Milestone 5 — still not
  implemented).

## 15. Remaining work before Milestone 7

Per the stop condition, **no customer frontend/backend integration and no deployment work has been
started.** The customer-facing pages under `src/app/` (outside `/admin`) are untouched and still
run entirely on Phase 1 mock data; `Navbar`/`Footer`'s two-line admin-path guard is the only touch
to shared customer-facing code, and it changes nothing for any non-admin route. Before Milestone 7
begins, the team should decide: which customer pages move to the real API first; how the existing
mock `AppProvider`/`services/*.ts` layer is replaced or bridged; and whether `NEXT_PUBLIC_API_URL`
and CORS (`APP_ORIGIN`) need updating for whatever environment Milestone 7 targets.
