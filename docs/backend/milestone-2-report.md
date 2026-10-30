# Milestone 2 report: public catalogue and search API

Status: complete. Update: the cleanup before Milestone 3 resolved the past-date inconsistency (section 9, item 1), the fixed seed dates (item 3 and section 4), the fuel-policy truncation (section 7, item 3), the transfer placeholder marking (item 5), and the package counting in JavaScript. See [milestone-3-report.md](milestone-3-report.md) section 1.

Scope: read-only public catalogue and search for destinations, locations, hotels (with rooms and rate plans), tours (with sessions), cars, transfers (vehicle classes and rates) and packages (with departures). No booking, holds, payment, inventory mutation, admin CRUD or frontend connection. No schema change and no migration.

## 1. Model reconciliation

- `backend/prisma/schema.prisma` is unchanged in this milestone. It has 32 models, including `IdempotencyKey` (added on purpose after Phase 2 change 1). `_DestinationToPackage` is the implicit many-to-many join table, not a model.
- Migrations: the two from Milestone 1, unchanged. `prisma migrate status` on the dev database reports the schema as up to date.
- `docs/backend/ARCHITECTURE.md` section 2 still says 31 models. It has not been edited in this milestone; the correction is pending.

## 2. Endpoints

All are `GET`, public (`@Public()`), under `/api/v1`. List responses are `{ items, meta: { page, pageSize, total, totalPages } }`. Errors are RFC 9457 `application/problem+json` with stable `code` values (`NOT_FOUND`, `VALIDATION_FAILED`).

| Endpoint | Query parameters (allowed values) |
|---|---|
| `/destinations` | `featured` (bool), `q` (name search), `sort` (`sortOrder`, `name`) |
| `/destinations/:idOrSlug` | Returns product counts and cover image |
| `/locations` | `type` (`AIRPORT`, `CAR_BRANCH`, `ZONE`), `destination` (slug) |
| `/hotels` | `destination`, `checkIn`, `checkOut`, `guests`, `rooms`, `maxPrice`, `stars` (1–5, comma list), `minGuestRating`, `amenities` (AND), `propertyTypes`, `sort` (`recommended`, `price-asc`, `price-desc`, `rating`, `stars`) |
| `/hotels/:idOrSlug` | Detail with gallery and cheapest published rate |
| `/hotels/:idOrSlug/rooms` | Published rooms with published rate plans |
| `/tours` | `destination`, `date`, `guests`, `categories` (codes), `maxPrice`, `durations` (`short`, `half`, `full`), `minRating`, `sort` (`recommended`, `price-asc`, `price-desc`, `rating`) |
| `/tours/:idOrSlug` | Detail with itinerary |
| `/tours/:idOrSlug/sessions` | `from`, `to` (max 90 days), `participants` |
| `/cars` | `pickupDate`, `dropoffDate` (max 60 days), `driverAge`, `categories`, `transmission`, `minPassengers`, `minBags`, `airConditioning`, `brands`, `maxPrice`, `sort` (`recommended`, `price-asc`, `price-desc`) |
| `/cars/:idOrSlug` | Detail with coverage, deposit, rental conditions |
| `/transfers/vehicle-classes` | Active classes, not paginated |
| `/transfers/rates` | `originLocationId`, `destinationLocationId` (UUIDs from `/locations`), `date`, `time`, `passengers`, `luggage` |
| `/packages` | `destination`, `duration` (`short`, `medium`, `long`), `budget` (`budget`, `mid`, `luxury`), `date`, `travellers`, `sort` (`recommended`, `price-asc`, `price-desc`) |
| `/packages/:idOrSlug` | Detail with components, pricing basis and itinerary |
| `/packages/:idOrSlug/departures` | `from`, `to` (max 365 days), `travellers` |

Identifiers: a UUID or a lowercase slug. Anything else returns 422 (malformed), not 404.

## 3. Query and visibility behaviour

- **Visibility gates** apply everywhere: `status = PUBLISHED`, `deletedAt IS NULL`, and the parent destination is published. Rooms and rate plans also need `PUBLISHED`.
- **Hotel search** lists only hotels with at least one sellable rate (a published room with a published rate plan). Hotel detail still resolves for such a hotel, with `fromPricePerNight: null`. Destination hotel counts use the same rule.
- **Sessions and departures** are `OPEN` only and must not have started. This was a real gap: the sessions endpoint previously returned a past-dated open session for a past window. Fixed with a `notBefore(now)` floor in `tours.repository.ts`, and `packages.repository.ts` applies the same floor to the date filter.
- **Ordering** is deterministic: every sort ends with `id`. Test `safety-and-performance` pages every list and checks there are no duplicates or gaps.
- **Offset pagination**: `page` 1–10000, `pageSize` 1–50 (default 20). Past the end returns an empty page with the true `total`.
- **Hotel search** uses one raw SQL statement built with `Prisma.sql`. Sort keys come from an allowlist. The cheapest rate per hotel comes from a `LEFT JOIN LATERAL` with `LIMIT 1`. Occupancy uses `EXISTS`.
- **Stay and rental validation**: dates must be real calendar dates; hotel check-in in the past is rejected (422); `checkOut` must follow `checkIn`; hotel stays are capped at 30 nights.
- **Tour `date`** uses a UTC day window. Seeded start times run from 06:30 to 20:00 Cairo time, which all fall on the same UTC date. A session starting between 00:00 and 03:00 Cairo time would fall on the previous UTC day. Documented limitation.
- **Unknown query parameters** return 422 (`forbidNonWhitelisted`).

Bugs found and fixed while testing:
- `GET /cars?transmission=MANUAL` returned 422 for every value. The list transform turned the single value into an array. Fixed with a scalar transform (`toCodeValue`).
- Hotel search listed hotels that could not be sold.
- The tours sessions endpoint returned past sessions.
- The tour itinerary dropped the clock time (`08:00`) that the frontend shows. Added `time` next to `offsetMinutes`.

## 4. Seed data

Source: `backend/prisma/seed/data.ts` (mirrors `H:\Booking\src\data\*`), `catalogue.ts` (idempotent upserts, no deletes, one transaction), `index.ts` (`prisma db seed`). Run with `npm run db:seed` (dev) and `npm run db:seed:test` (test, through the `_test` guard). The integration suites also call `seedCatalogue` directly.

Development data, as currently in `egypt_beyond_dev`:

| Table | Rows | Notes |
|---|---|---|
| Destination | 7 | 6 published, 1 draft (`hidden-siwa`) |
| Location | 13 | 5 airports (real coordinates), 5 zones, 2 car branches, 1 archived |
| Hotel | 11 | 7 public; 4 hidden: draft, soft-deleted, unsellable, draft destination |
| Room / RatePlan | 17 / 17 | Includes 1 draft room |
| Tour / TourSession | 7 / 113 | 6 published, 1 archived; 2 hidden sessions (1 past OPEN, 1 CLOSED) |
| CarModel / CarInventory | 8 / 720 | 7 published, 1 draft; rolling 30-day window |
| TransferVehicleClass / TransferRate | 5 / 52 | 50 routes (both directions); 1 expired, 1 inactive |
| Package / PackageDeparture | 6 / 23 | 4 published, 1 draft, 1 soft-deleted; 1 hidden past departure |
| Media | 98 | `IMPORTED_EXTERNAL`, with attribution and licence code |
| CancellationPolicy / PricingRule / Setting | 10 / 3 / 6 | VAT 14%, service fee 3%, young-driver surcharge (EGP 150/day below 25) |

Names, prices, descriptions, amenities, itineraries, durations and dates are copied from the frontend mock data. Where the schema needs a value the frontend does not have, the value is labelled `DEV DEFAULT` in the seed. Those values are listed in section 7.

Dates: the frontend tour and package dates are fixed. Tour sessions run 2026-10-10 to 2026-10-28, and package departures run 2026-10-10 to 2026-11-14. After those dates the public lists show no sessions or departures for those products until the seed is changed to rolling dates. Tests do not depend on the calendar: they read the next real session or departure from the database.

## 5. Tests

- Unit: 25 of 25 pass (`npm test`).
- Integration: 164 of 164 pass (`node scripts/run-integration.mjs`), against real PostgreSQL 17 in the `eb-test` container.
  - Milestone 1: 33 (auth, refresh concurrency, rate limit, DB invariants, health).
  - Milestone 2: 131 in 7 suites under `test/catalogue/`:
    - destinations: 12
    - hotels: 28
    - tours: 22
    - cars: 14
    - transfers and locations: 14
    - packages: 21
    - safety, ordering and query behaviour: 20 (includes parameterised paging and query-count cases)
- What the catalogue suites cover: every filter and sort, invalid and out-of-range parameters (422), valid and invalid identifiers, unpublished and draft content (hidden), soft-deleted rows, parent-destination gating, hotel to rooms, destination relationships, empty results, paging boundaries, deterministic ordering, date and window validation, no internal fields in any response (scanned across every endpoint), image field allowlist, no N+1 (statement counts compared for 1 row and for 50 rows), and seed idempotency.

## 6. Gate results

| Check | Result |
|---|---|
| `npm test` (unit) | 25 / 25 pass |
| `npm run test:integration` (via runner) | 164 / 164 pass |
| `npm run lint` (src, test) | 0 errors |
| `eslint prisma/seed` | 0 errors |
| `npm run typecheck` | exit 0 |
| `npm run build` (`nest build`) | exit 0; `dist/main.js` produced |
| `prisma migrate status` (dev) | up to date |

## 7. Deviations from the frontend, and dev defaults

Deviations (the API differs from the frontend mock):
1. **Hotel price.** Frontend `pricePerNight` is one room's price (Marriott: 6800, the Pyramid View King). The API returns the cheapest published rate (Marriott: 5200, the Garden Twin). The spec asks for the cheapest rate. The frontend should show the same value, or the mock should change.
2. **Destination counts.** Frontend `listingsCount` is hard-coded. The API computes counts from the catalogue.
3. **Car fuel policy.** The frontend text ("Full to full. Refuel before returning to avoid charges.", 56 characters) does not fit `CarModel.fuelPolicy` (`VarChar(40)`). Stored as "Full to full". The full sentence should move to `pickupNotes` or the column should widen (a schema change, needs a decision).
4. **Airport ids.** The frontend uses `cai`, `hrg`, and so on. The API uses location UUIDs from `GET /locations`. The frontend needs a mapping when it is connected.
5. **Rooms** have no slug in the schema. They are addressed only through their hotel. The frontend's room ids (for example `mena-pyramid-view-king`) become room `code`.
6. **Tour and package dates** are fixed in the frontend (see section 4).
7. **Hotel check times** are not in the frontend. Seeded as 14:00 and 12:00 (DEV DEFAULT).

Dev defaults (not from the frontend; replace before launch):
- Hotel check-in 14:00, check-out 12:00.
- Car cancellation `car-default` (72 hours) and package cancellation `package-default` (14 days).
- Package traveller limits 1–10, departure capacity 20, pricing basis `PER_PERSON`.
- Transfer prices: the frontend's base price per vehicle class, applied to every route. Transfer duration 60 minutes. **Placeholders until finance confirms.**
- Airport and zone coordinates: airports only, real public coordinates. Zones and branches have none.
- Media: external images have width, height and size of 0. They were not downloaded. Commons files have an unverified licence (`UNVERIFIED-COMMONS`). Unsplash photos are credited without a photographer name.

## 8. SQL and performance observations

- **Query counts are constant** for every list endpoint, regardless of page size. Destinations list: 9 statements for 1 row and for 50 rows. The no-N+1 tests enforce this.
- **Hotel search plan** (dev data, 11 hotels): index scans on `Hotel_status_guestRatingAvg_idx`, `Destination_status_isFeatured_sortOrder_idx`, `Room_hotelId_code_key` and `RatePlan_roomId_code_key`. The lateral subquery runs once per candidate hotel (8 loops). Execution 0.4 ms. This is fine at this size and says little about larger data.
- **The schema's cached `fromPriceAmount`** on `Hotel` is set by the seed but not read by search, which recomputes the cheapest rate live. At scale, either read the cache (maintained by a job, not yet written) or add `RatePlan(roomId, status, basePricePerNight)` so the lateral is a single index read.
- **Package product counts** load every matching published package row and count in JavaScript. A grouped query (or a join count) would avoid transferring those rows before scale.
- **Offset pagination** gets slower for deep pages (`page` up to 10000 at `pageSize` 50). Keyset pagination would be needed for deep browsing.
- **Media** is read in one query per list (`coversByOwner`) and one per gallery, not per item.

## 9. Known gaps and decisions needed

1. **Past dates are treated inconsistently.** Hotel check-in in the past is rejected (422). Car pickup, tour `date` and transfer `date` in the past are accepted and return empty results (tours and packages clamp to today). Pick one rule.
2. **Unsellable hotels** are hidden from search but visible at detail with no price. Confirm this is the intent.
3. **Transfer prices and durations** are placeholders (see section 7).
4. **Car fuel policy** text, see section 7.
5. **Image licences** for Commons files need checking per file, and real dimensions need backfilling.
6. **Enum ordering.** Vehicle classes sort by enum declaration order (`SEDAN`, `PREMIUM`, `SUV`, `VAN`, `MINIBUS`), which is deterministic but not alphabetical. Change to name order if the frontend needs it.
7. **`airConditioning=false`** on `/cars` does not filter anything. Only `true` restricts.
8. **Availability** (hotel rooms, tour sessions, car branches, transfer capacity) is not applied. Milestones 3–4.
9. **Rolling dates** for the seed (section 4).
10. **Test database hygiene.** The Milestone 1 `db-invariants` suite creates `dest-*` draft destinations in the test database and never removes them. The catalogue suites are unaffected because they assert on seeded slugs. The M1 suite should clean up after itself; not changed here.
11. **`package.json#prisma`** (seed config) is deprecated in Prisma 7. Move it to `prisma.config.ts` before upgrading.
12. **Cars and tours with past dates** are returned empty, not rejected (see item 1).

## 10. Not done in this milestone

- No booking, quote, hold, payment, inventory mutation, refund or webhook.
- No admin CRUD or write endpoints for the catalogue.
- No frontend changes; the frontend is not connected.
- No Milestone 3 work.
- `docs/backend/ARCHITECTURE.md` model count (31 → 32) not updated.
