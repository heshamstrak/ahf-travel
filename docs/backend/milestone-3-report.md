# Milestone 3 report: pricing engine and quote API

Status: complete, and the gate is green. Milestone 4 has not been started.

Scope: the backend is the only source of price calculation for hotel, tour, car, transfer and package. A quote is an immutable server-side snapshot with an expiry. The client supplies a product and a selection, never an amount.

Not in this milestone: booking creation, quote consumption, holds, inventory mutation, payments, and frontend integration. Availability is read and checked, never reserved.

## 1. Cleanup before Milestone 3

Each item is the approved decision, applied as stated.

1. **Model count (32).** `docs/backend/ARCHITECTURE.md` now says 32 V1 models, with `IdempotencyKey` as the intentional 32nd. The Revision 2 tables that said 31 are corrected in place and point to the new section 22. The row that claimed `IdempotencyKey` was merged into `Quote` is replaced: request idempotency and quote identity are separate, and the booking-replay step no longer depends on Quote.
2. **Hotel "from" price.** No code change. The API returns the cheapest currently sellable applicable rate. The frontend mock value (Marriott 6800) is outdated and is not reproduced.
3. **Past dates, standardised as 422.** A user-supplied start date in the past returns `422 VALIDATION_FAILED` for hotel check-in, tour `date`, tour session `from`, car `pickupDate`, transfer `date`, package `date` and departure `from`. Business dates use Africa/Cairo through `Intl` (`src/common/business-date.ts`). Date-only values are compared as calendar strings and are never converted through UTC. Five unit tests pin the timezone cases: 22:30 UTC is already the next Cairo day, and the offset is +2 in winter and +3 in summer.
4. **Rolling seed dates.** Tour sessions use day offsets `[2,3,4,6,8,10,12,14,17,20]`, package departures `[5,12,19,33,40]`, and the closed-session fixture is at offset 23. All are relative to the Cairo business date at seed time. Explicit past fixtures (2025-06-01) stay absolute, so visibility tests do not depend on the clock. Seeds remain idempotent upserts.
5. **Transfer placeholders are marked.** A new `TransferRate.isDevPlaceholder` column is set by the seed. Quote lines carry the note `DEV_PLACEHOLDER_PRICE`, the product carries `priceBasis: DEV_PLACEHOLDER`, and the catalogue rate list shows `priceBasis` too. Exchange rates are seeded with `source: DEV_PLACEHOLDER`.
6. **Fuel policy is not truncated.** `CarModel.fuelPolicy` is `VARCHAR(200)`, and the Corolla keeps its full text. Migration `20261006213745_quote_pricing_and_field_widening` was created with Prisma and then extended with hand-written rules. Its first apply failed on unquoted camel-case identifiers, which Postgres folds to lower case. That failure was caught on the shadow database, before the migration was applied anywhere.
7. **Image licensing.** Nothing is claimed as verified. Commons files remain `UNVERIFIED-COMMONS`, and external images still have width, height and size 0.
8. **Milestone 1 invariants suite cleaned up.** Every check runs inside a transaction that is always rolled back, so it keeps no fixture rows. Audit rows cannot be deleted by design (append-only trigger), so the suite never creates them outside a rolled-back transaction. The previous runs had left 5 `vat-*` tax rules at 14%, 5 `dest-*` destinations and 15 `hotel-*` hotels, 5 `tour-*` tours and 5 `p-*` policies in the shared test database. Those rows were deleted in dependency order, and seeded data is unaffected. The 5 earlier audit rows remain, as they must.
9. **Package counts in the database.** `destinations.repository.ts` counts packages with one grouped SQL query over `_DestinationToPackage`, not in JavaScript. The API output is unchanged.

Migrations, all unapplied before this work and then applied to dev and test:
- `20261006213745_quote_pricing_and_field_widening`: `CarModel.fuelPolicy` VARCHAR(200); `TransferRate.isDevPlaceholder`; `Quote.surcharge`, `displayCurrency`, `displayFxRate`, `displayTotal`, `guestTokenHash`; check constraints for money sign, discount within subtotal, the total identity, display completeness, owner presence and expiry order; the immutability trigger `eb_quote_immutable`; and the TRUNCATE guard.
- `20261006220103_quote_total_includes_surcharge`: drops `Quote_total_reconciles`, the Milestone 1 identity that had no surcharge term. It was rejecting every quote with a surcharge. The complete rule is `Quote_total_adds_up`.

## 2. Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/quotes` | Body: `{ productType, productId, selection, displayCurrency? }`. Returns `201` with the quote. A guest also receives `guestToken` once. |
| GET | `/api/v1/quotes/:id` | Owner (bearer) or guest (`X-Quote-Token`). Anyone else gets `404`. Returns the stored snapshot, with `status` ACTIVE or EXPIRED. |

Per-product `productId` and `selection`:

| productType | productId | selection (strict; unknown fields refused) |
|---|---|---|
| HOTEL | ratePlanId | `checkIn`, `checkOut`, `rooms` (1–6, default 1), `adults` (1–12), `children` (0–8, default 0) |
| TOUR | tourSessionId | `participants` (1–40) |
| CAR | carModelId | `pickupDate`, `dropoffDate`, `pickupLocationId`, `driverAge` (18–99) |
| TRANSFER | transferRateId | `date`, `passengers` (1–12), `luggage` (0–12, default 0) |
| PACKAGE | packageDepartureId | `adults` (1–10), `children` (0–10, default 0), `rooms` (1–10, only for per-room packages) |

The top-level body accepts only those five keys. Client-supplied `subtotal`, `total`, `tax`, `fee`, `discount`, `currency`, `lines`, `userId` and `guestTokenHash` are refused with `422`. So are prices or totals inside the selection.

## 3. Pricing algorithm per product

Amounts are computed from catalogue and pricing rows only. Each refusal uses a stable code.

- **Hotel.** Per room per night the rate is the `RoomRate` override for that date, else `basePricePerNight`. The room total is the sum over nights. Guests are split across rooms, earlier rooms taking remainders. Extra adults above `baseOccupancy` and all children are charged per night at `extraAdultPerNight` and `extraChildPerNight`. If a party needs an extra rate that is null, the quote is refused with `PARTY_NOT_ALLOWED` and is never priced at zero. Stays are 1–30 nights, and check-in must not be in the past. Every night needs `RoomInventory` with at least `rooms` free units, otherwise `409 NOT_AVAILABLE`. Seeded windows are 60 days.
- **Tour.** Participants × unit price, where the unit price is the session override (with its own currency) else `pricePerPerson`. The session must be OPEN, the tour published, and the session not yet started (`startsAt > now`), otherwise `404`. Participants must not exceed `maxGroupSize`, and remaining seats (capacity − booked − held) must cover them, otherwise `409`.
- **Car.** Rental days are whole calendar days from pick-up to drop-off. Drop-off must be after pick-up, and the maximum is 60 days. Pick-up is at a published airport or car branch. Driver age must be at least `CarModel.minDriverAge` (per model, refused with `DRIVER_TOO_YOUNG`). Each day needs a free `CarInventory` unit at the pick-up branch. The young-driver surcharge is a `SURCHARGE` rule (`driverAgeBelow: 25, perDay: true`, flat 150.00 EGP), so the line is days × 150.00. It is not hard-coded.
- **Transfer.** One price per vehicle, from the active `TransferRate` for the origin, destination and vehicle class. The rate's validity window must cover the date (an expired rate is `404`). Passengers and luggage must fit the class limits (`PARTY_NOT_ALLOWED`). A free `TransferCapacity` unit is needed on the date. Seeded rates are placeholders and are marked as such.
- **Package.** Behaviour depends on `pricingBasis`. Travellers must be within `minTravellers`, and the departure must be OPEN and start after today.
  - `PER_PERSON`: adults × `basePrice`, plus children × `childPrice` (refused if null), plus `singleSupplement` when exactly one traveller and the supplement is non-null.
  - `PER_ROOM`: rooms × `basePrice`, plus `extraPersonPrice` × persons above two per room (refused if null and needed). `rooms` is required.
  - `PER_PACKAGE`: flat `basePrice`, plus `extraPersonPrice` × travellers beyond `maxTravellers` (refused if null and needed).
  - A departure's `priceOverride` replaces `basePrice`. Its currency must match the package currency, otherwise it is a configuration fault (500), not a client error.
  - The old `startingPrice / 2` assumption is not used anywhere.

Remaining seats (capacity − booked − held) are read for tours, packages, cars and transfers. For hotels, free units are totalUnits − soldUnits − heldUnits − blockedUnits. No counter is ever written by the pricing path.

## 4. Money and rounding

- Amounts are `bigint` minor units with the currency's exponent: 2 for EGP, USD and EUR; 0 for JPY; 3 for KWD. JavaScript floating point is not used for any authoritative value. Decimal strings are parsed exactly, and extra digits beyond the exponent are refused.
- Percentages are exact rationals (for example `0.1400` = 1400/10000). A line is `applyRate` with `divideHalfUp`, which rounds halves up once per line.
- Every line carries its currency. Combining two currencies throws, so a currency bug fails loudly and is never silently summed.
- The stored breakdown is: `subtotal` (gross product base), `discount`, `surcharge`, `fee`, `tax`, `total`. The check constraint is `total = subtotal − discount + surcharge + fee + tax`. Fees and taxes are both computed on the net (subtotal − discount + surcharge), which matches ARCHITECTURE 6.2 step 5 and 6.
- Display currency is presentation only. The quote currency is the legal total. Conversion uses the snapshotted `ExchangeRate` (1 base = rate quote) and is rounded once. The rate and the converted total are stored with the quote. An unconfigured display currency, or one with no rate, is refused with `CURRENCY_NOT_SUPPORTED`.
- Rounding examples checked by tests: 5 piastres at 10% → 1; 25 at 14% → 4; 35 at 14% → 5; 0.10 + 0.20 → 0.30 exactly. The hotel case with a 6800.01 night gives 13600.01, fee 408.00, tax 1904.00, total 15912.01.

## 5. Pricing-rule behaviour

- A rule applies when it is active, valid on the business day (`validFrom ≤ today ≤ validTo`), matches the product type (or `null` = all products), and its conditions hold.
- Conditions: `driverAgeBelow`, `minNights`, `minTravellers`, `perDay`. An unknown condition, or a `perDay` rule without a day count, is a configuration error that fails the quote closed. It is never silently ignored.
- A flat amount applies only in its own currency. A mismatch makes the rule not applicable.
- Order: discounts and surcharges are computed on the gross base, then net, then fees and taxes on the net. Percentages never compound, so the rule order cannot change an amount. Ties sort by `priority`, then `code`.
- Discounts are capped at the base they discount.
- Each line stores a snapshot of its rule: `id`, `code`, `kind`, `label`, `percent`, `flatAmount`, `flatCurrency`, `conditions`, `priority`, the validity window, and `version` (the rule's `updatedAt`). The response shows `code`, `kind`, `label`, `version`, `percent`, `flatAmount` and `flatCurrency`, but not the internal id.
- Changing a rule later never changes an existing quote. Tests change VAT from 14% to 20%: the old quote keeps tax 1904.00 and its rule version, and a new quote for the same stay gets 2720.00.
- Seeded rules: VAT 14%, platform fee 3%, young-driver surcharge (flat 150 EGP per day below 25), and a DEV PLACEHOLDER long-stay discount of 5% from seven nights on hotels.

## 6. Ownership, expiry and immutability

- `expiresAt` = creation time + `Setting quote.ttlMinutes` (15). `holdMinutes` is copied from `booking.holdMinutes` at creation.
- Reading after expiry returns the same snapshot with `status: EXPIRED`. Nothing is recalculated. Milestone 4 must refuse an expired quote at consumption (`410 QUOTE_EXPIRED`), as the architecture's booking transaction already does.
- A signed-in creator's quote records `userId`. Only that user can read it. Other users, and anonymous callers, get `404`.
- A guest quote gets a 256-bit random token (`base64url`) at creation, shown once. The database stores only its SHA-256 (`guestTokenHash`). Reads need the token in `X-Quote-Token`, and a wrong or missing token gets `404`.
- Creation is not idempotent: each `POST` is a new quote. Request replay belongs to `IdempotencyKey` (Milestone 4).
- The immutability trigger allows one change: `consumedAt` from NULL to a timestamp (Milestone 4). Every other column is frozen, and DELETE and TRUNCATE are refused. Tests prove each of these against the real database.
- The time source is the injectable `Clock`. Production never advances it. Tests move it forward to prove expiry without sleeping.
- Responses never include `userId`, `guestTokenHash`, internal rule ids or `storageKey`. The product snapshot carries public catalogue ids and names (hotel, room, package), which the catalogue endpoints already expose. A test scans the response bodies for the internal fields.

## 7. Tests

Unit: **63 of 63** pass (`npm test`).
- 25 from Milestones 1 and 2.
- 8 money: exact parsing and formatting, exponents, rounding boundaries, rates and conversion.
- 8 rules: adjustment order, the breakdown identity, determinism, conditions, validity, caps, fail-closed behaviour, snapshots.
- 17 calculators: occupancy split, hotel nights and extras, tour limits, rental days and driver age, transfer party, and every package basis.
- 5 business date: Cairo calendar date, DST and winter offsets, instants, calendar arithmetic, past-date refusal.

Integration: **223 of 223** pass (`node scripts/run-integration.mjs`), against PostgreSQL 17.
- 33 from Milestone 1, unchanged in purpose; the invariants suite now rolls back.
- 131 from Milestone 2 (catalogue), with the past-date and rolling-date changes.
- 59 quote tests:
  - hotel: 12 (arithmetic, long stay, non-refundable rate, RoomRate override, half-piastre rounding, party limits, dates, zero and negative quantities, unpublished rates, inventory window, sold-out night with counters restored, token and secrecy)
  - tour: 8 (arithmetic, maximum group, session visibility, seats left with restore, override currency, archived tour, switched-off fee rule)
  - car and transfer: 12 (young-driver surcharge, minimum age, rental-day and pick-up rules, branch-only pick-up, inventory window, invalid fields; transfer placeholder marking, party limits, expired and inactive routes, past date, capacity)
  - package: 10 (PER_PERSON, single traveller, children refused, rooms refused, PER_ROOM, PER_ROOM refused without extra price, PER_PACKAGE, departure visibility and seats, group limits)
  - security: 17 (ownership, guest token, owner-only reads, malformed and unknown ids, invalid bearer, expiry via the clock, immutability and TRUNCATE, consumedAt-only change, rule change after quote, tampering at top level and inside the selection, unknown product, determinism, no internal fields, display conversion, unconfigured display currency)

## 8. Gate results

| Check | Result |
|---|---|
| `npm test` (unit) | 63 / 63 pass |
| `npm run test:integration` (runner, `.env.test`, non-destructive migrate) | 223 / 223 pass |
| `npm run lint` (src, test) | 0 errors |
| `npx eslint "prisma/seed/**/*.ts"` | 0 errors |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| `prisma migrate status` (dev) | up to date |

## 9. Architecture deviations

These are deliberate. Each is recorded here so the design document can be updated.

1. **Guest quotes need a token as well as an id.** The Revision 2 design protected guest quotes with an unguessable id alone. A 256-bit token that is shown once and stored as a hash is stronger, and it costs one header.
2. **`subtotal` means the gross product base.** The design's step 4 called the net amount `subtotal`. The column is now the gross base, and the net is derivable. The total identity is `total = subtotal − discount + surcharge + fee + tax`, which needs the new `surcharge` column.
3. **Fees and taxes are computed on the net**, as in the design, and never compound on each other. This is stated in the rule order.
4. **Quote immutability is enforced by a database trigger**, not only by the application. The trigger allows `consumedAt` once, which Milestone 4 needs.
5. **Display currency is stored on the quote** (`displayCurrency`, `displayFxRate`, `displayTotal`). The design had it only on Booking.
6. **Availability is read from inventory and seeded in rolling windows** (hotel rooms 60 days, transfers 30 days, cars 30 days). Beyond the window a quote is refused with `409 NOT_AVAILABLE`. This is a development limit; production inventory is populated by operations.
7. **Expired transfer rates return `404`**, not `422`, because the route is not sellable for that date. A date before today returns `422`.
8. **Hotel extra rates are not seeded** (the frontend has none). A party above base occupancy is refused until the rate plan defines an extra rate.
9. **Optional authentication** was added to the guard (`@OptionalAuth`): a missing bearer is a guest, an invalid bearer is still refused.
10. **The long-stay discount** is a DEV PLACEHOLDER. It exercises the discount path, and it is not a confirmed commercial rule.
11. **Single currency per quote.** A quote is priced in one currency: the product's own, or a session override's. The design allowed mixed-currency lines; that is not needed while the catalogue is EGP-only, and the rule that would need it (rate conversion between line currencies) is not built.
12. **Quote status is derived at read time** from `expiresAt`. There is no stored status column and no expiry job.

## 10. Not done in this milestone

- Booking creation, quote consumption, holds, inventory mutation, payment, refunds, webhooks.
- A quote clean-up job for expired quotes.
- Cancellation policy refund previews (the policy is returned on the quote but not evaluated).
- Deposits on cars are not included in the total. They are shown on the catalogue detail only.
- The frontend is not connected.
- 5 append-only `AuditEvent` rows from earlier runs remain in the test database. They cannot be deleted by design.
