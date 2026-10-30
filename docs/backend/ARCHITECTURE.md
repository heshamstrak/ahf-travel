# Egypt Beyond — Backend Architecture (Phase 2, revision 2)

Status: **proposal for approval. No backend code, no migrations, no frontend changes.**
Companion: `docs/backend/schema.prisma` (V1 only; validated with `prisma validate` v6).

Counts: **V1 = 32 models, 27 enums** (Revision 4, section 22, supersedes the 31 count in the Revision 2 tables below; `IdempotencyKey` is the 32nd model). Deferred designs = 5 models, 4 enums (documented here, not in the schema file). Original draft = 51 models, 32 enums.

---

## 0. Decisions applied in this revision

| Decision | How it is reflected |
|---|---|
| Guest checkout allowed | `Booking.userId` is nullable. Guest bookings are read by reference plus email. Guest quotes are capability-protected by an unguessable quote id with a 15-minute TTL. |
| No hard-coded VAT or fee | Tax and fee are `PricingRule` rows (`kind = TAX | FEE`), seeded at install and editable by FINANCE. Code contains no rate. |
| Package price basis is explicit | `Package.pricingBasis` enum: `PER_PERSON`, `PER_ROOM`, `PER_PACKAGE`. Occupancy rules in section 6. `startingPrice / 2` removed. |
| Guest and occupancy rules | Hotels: `Room.baseOccupancy`, `maxAdults`, `maxChildren`, `RatePlan.extraAdultPerNight`, `extraChildPerNight`. Packages: `singleSupplement`, `childPrice`, `extraPersonPrice`, `minTravellers`, `maxTravellers`. Cars: `CarModel.minDriverAge` plus a `PricingRule` surcharge. |
| No passport numbers in V1 | No column, no table. `Traveler` is deferred (V1.1) and will also not store passport numbers unless compliance approves. |
| Multi-currency-ready | Every money value is an amount with a `currency CHAR(3)` column. No EGP-only column names. The base currency is a `Setting`. Booking holds a settlement currency plus an optional display currency with an FX snapshot. |
| Provider-agnostic payments | `Payment.providerName` is a string, not an enum. Hosted or tokenised fields only: the server stores a provider reference, brand, last four digits, and expiry. |
| Hold duration configurable | `Setting['booking.holdMinutes']` (default 15). Copied onto each `Booking.holdMinutes` at creation, so later changes never shift existing holds. |
| Audit design fixed | Content rows carry `createdById`/`updatedById` only where a human authors current state. Money and inventory changes go to `AuditEvent`. Details in section 3. |
| Over-engineering review | Every model and enum classified in section 2. |

---

## 1. Frontend requirements (condensed)

The frontend is the spec. Full field-level analysis is in revision 1. The points that drive this revision:

- **Hotels:** search by destination, dates, guests, rooms; filters on price, stars, guest rating, amenities, property type; room offers with rate plan (refundable, meal plan) and occupancy-sensitive price.
- **Tours:** sessions are date **and** time with capacity; per-person price; itinerary is display content.
- **Cars:** pick-up location, dates, driver age, category/transmission/brand filters; per-day price; deposit and insurance shown.
- **Transfers:** route (origin to destination) and vehicle class with fixed price, passenger and luggage limits, and a "custom" option that needs locations in V1 (free text is not priceable; section 19, Q10).
- **Packages:** pricing basis drives the displayed and charged amount; itinerary and included lists are display content in V1.
- **Checkout:** one product per order, lead customer details, payment method choice (card, or pay later for hotels and packages), totals with tax and fee lines.
- **Favorites:** hotels, tours, cars, packages (not transfers). Sync from anonymous storage on login.
- **Reviews:** shown today as mock data. Real reviews are deferred; V1 displays catalogue rating fields set by import.

---

## 2. Model and enum classification (over-engineering review)

### 2.1 Original draft to revision 2, model by model

| Original model | Revision 2 | Reason |
|---|---|---|
| User | **V1** | Accounts, bookings, favorites |
| RefreshToken | **MERGED** into `AuthToken` (type `REFRESH`) | Same hashed-token pattern, one table |
| AuthToken | **V1** | Verify email, reset password, refresh |
| Destination | **V1** | Grouping and search |
| Location | **V1** | Airports, branches, transfer zones; required for car pick-up and transfer routes |
| Media | **V1** | Images for every product |
| MediaLink | **MERGED** into `Media` (owner columns) | A media item has exactly one owner in V1; the join table bought nothing |
| CancellationPolicy | **V1** | Refund calculation needs a stored, versioned rule set |
| HotelAmenity | **MERGED** into `Hotel.amenities String[]` (GIN index) | Small admin-typed catalogue; the filter is array containment |
| Hotel | **V1** | Core product |
| Room | **V1** | Inventory unit |
| RatePlan | **V1** | Refundable vs non-refundable and meal plan are sold per rate plan |
| RoomRate | **V1** | Seasonal nightly price; without it every date has the same price |
| RoomInventory | **V1** | Hotel availability counters (section 4) |
| Tour | **V1** | Core product |
| TourItineraryStep | **MERGED** into `Tour.itinerary Json` | Display-only, never queried or priced |
| TourSession | **V1** | Date-and-time departure with capacity |
| CarModel | **V1** | Core product |
| CarRate | **DEFERRED** (V1.1) | V1 uses `CarModel.pricePerDay`. Seasonal car pricing is added when needed |
| CarInventory | **V1** | Branch-per-day counters |
| TransferVehicleClass | **V1** | Vehicle class catalogue and capacity limits |
| TransferRoute | **MERGED** into `TransferRate` | Route is just origin and destination; no extra attributes worth a table |
| TransferRoutePrice | **MERGED** into `TransferRate` (route, class, amount) | One row is the bookable product |
| TransferDistanceTariff | **DEFERRED** (V1.1) | V1 requires location-to-location routes. Distance pricing needs geocoding and a tariff engine |
| TransferCapacity | **V1** | Prevents over-selling a vehicle class on a day |
| Package | **V1** | Core product; carries `pricingBasis` and itinerary/includes JSON |
| PackageDay | **MERGED** into `Package.itinerary Json` | Display-only |
| PackageHotel | **MERGED** into `Package.includes Json` (V1) | Described, not reserved, in V1 (section 4.7) |
| PackageTour | **MERGED** into `Package.includes Json` (V1) | As above |
| PackageTransfer | **MERGED** into `Package.includes Json` (V1) | As above |
| PackageComponent (new, designed for V1.1) | **DEFERRED** (V1.1) | Needed only when components reserve their own stock |
| PackageDeparture | **V1** | Sellable package date with allotment |
| PricingRule | **V1** | Tax, fee, surcharge rules as data |
| ExchangeRate | **V1** | Multi-currency snapshot source; the table is tiny and the frontend already offers USD/EUR |
| Quote | **V1** | Server-side price snapshot; booking creation consumes it |
| Booking | **V1** | Order |
| BookingItem | **V1** | Product line; holds product-specific nullable keys |
| BookingHotel | **MERGED** into `BookingItem` (`hotelId`, `roomId`, `ratePlanId`) | Five near-identical detail tables collapsed into nullable keys with per-type CHECKs |
| BookingTour | **MERGED** into `BookingItem` (`tourId`, `tourSessionId`) | As above |
| BookingCar | **MERGED** into `BookingItem` (`carModelId`, `pickupLocationId`) | As above |
| BookingTransfer | **MERGED** into `BookingItem` (`transferRateId`) | As above |
| BookingPackage | **MERGED** into `BookingItem` (`packageDepartureId`) | As above |
| Traveler | **DEFERRED** (V1.1) | V1 keeps `adults` and `children` counts on the item. Names are collected later |
| BookingEvent | **MERGED** into `AuditEvent` | One append-only event table |
| Payment | **V1** | Provider-agnostic payment attempt |
| PaymentAttempt | **MERGED** into `Payment` (one row per attempt) | An attempt is a payment with its own idempotency key |
| Refund | **V1** | Cancellation refunds |
| WebhookEvent | **V1** | Inbound provider events, deduplicated |
| Favorite | **V1** | Small, direct value for the frontend |
| Review | **DEFERRED** (V1.1) | Needs booking-linked eligibility and moderation. V1 uses imported rating fields |
| IdempotencyKey | **V1 (kept, Revision 4)**: request replay for booking creation and payment sessions. Separate from `Quote`; see section 22 | Quote identity and request idempotency are different concerns |
| AuditLog | **MERGED** into `AuditEvent` | Same concern |

Summary: **28 original models kept, 19 merged or removed, 4 deferred** (Review, CarRate, TransferDistanceTariff, Traveler). Plus 3 new V1 models (`Setting`, `TransferRate`, `AuditEvent`) and 1 deferred new model (`PackageComponent`). Revision 2 result was 31 models. Revision 4 restores `IdempotencyKey`, giving **32 V1 models**.

### 2.2 Enums

| Enum | Classification | Note |
|---|---|---|
| Role | V1 | |
| UserStatus | V1 | |
| Language | V1 | |
| Currency | **REMOVED**, replaced by `CHAR(3)` columns | Adding a currency must not need a migration |
| ContentStatus | V1 | |
| ProductType | V1 | |
| AuthTokenType | V1 | |
| LocationType | V1 | |
| MediaSource | V1 | Needed to record Commons/Unsplash attribution |
| MediaStatus | V1 | |
| MediaOwnerType | V1 | |
| PropertyType | V1 | |
| MealPlan | V1 | |
| PricingBasis | **NEW, V1** | Package pricing basis |
| TourCategory | V1 | |
| SessionStatus | V1 | Used by tour sessions and package departures |
| CarCategory | V1 | |
| Transmission | V1 | |
| FuelPolicy | **REMOVED**, replaced by `String` default `FULL_TO_FULL` | One value is used today; a catalogue value is not worth an enum |
| TransferVehicleType | V1 | |
| BudgetTier | V1 | Package filter |
| PricingRuleKind | V1 | |
| BookingStatus | V1 | |
| BookingItemStatus | V1 | |
| PaymentStatus | V1 | Stored for filtering |
| PaymentMethod | V1 | |
| PaymentProvider | **REMOVED**, replaced by `String` | Provider-agnostic by design |
| PaymentState | V1 | |
| RefundState | V1 | |
| BookingActor | **RENAMED** to `ActorType` (V1) | Used by `AuditEvent` and booking cancellation |
| TravelerType | DEFERRED | With `Traveler` |
| ReviewStatus | DEFERRED | With `Review` |
| TripType | DEFERRED | With `Review` |
| PackageComponentKind | DEFERRED | With `PackageComponent` |

**V1: 27 enums** (Role, UserStatus, Language, ContentStatus, ProductType, AuthTokenType, LocationType, MediaSource, MediaStatus, MediaOwnerType, PropertyType, MealPlan, PricingBasis, TourCategory, SessionStatus, CarCategory, Transmission, TransferVehicleType, BudgetTier, PricingRuleKind, BookingStatus, BookingItemStatus, PaymentStatus, PaymentMethod, PaymentState, RefundState, ActorType). **Deferred: 4.**

### 2.3 What was kept despite looking optional

- `Setting`: hold duration, quote TTL, and base currency must change without a deploy.
- `ExchangeRate`: one tiny table; without it a USD or EUR display on a quote has no source.
- `CancellationPolicy`: shared by rate plans, tours, cars, and packages. Its rules are copied onto each booking, so a later edit cannot change a past refund.
- `TransferCapacity`: without it two users can take the last vehicle of a class on the same day.
- `RoomRate`: without it the hotel price is the same on every date.

---

## 3. Audit design

### 3.1 Principles

1. **Current-state authorship** (who last changed this content) is a column pair on human-edited catalogue rows.
2. **History** (what changed, from what, to what, and when) is `AuditEvent`, written **in the same database transaction** as the change. There is no separate log that can drift.
3. Money and inventory rows are high-volume and numeric. They are audited through events only, not author columns.

### 3.2 Content entities: author columns required

These are admin-authored, customer-visible, low-volume, and published. Each carries `createdById` and `updatedById` (UUID, **no foreign key**, so anonymising a user never breaks content history).

| Entity | Columns | Notes |
|---|---|---|
| Destination | createdById, updatedById | |
| Location | createdById, updatedById | |
| Hotel | createdById, updatedById | |
| Room | createdById, updatedById | |
| RatePlan | createdById, updatedById | Its prices are also audited via events |
| Tour | createdById, updatedById | |
| CarModel | createdById, updatedById | |
| TransferVehicleClass | createdById, updatedById | |
| Package | createdById, updatedById | |
| CancellationPolicy | createdById, updatedById | |
| PricingRule | createdById, updatedById | Tax and fee changes are financially material |
| Setting | updatedById | Key-value; creation is seed data |
| Media | uploadedById | Uploader, not editor |

### 3.3 Entities explicitly WITHOUT author columns (events instead)

RoomRate, RoomInventory, TourSession, CarInventory, TransferCapacity, TransferRate, PackageDeparture, ExchangeRate. Reason: high-volume or numeric; every change produces an `AuditEvent` carrying actor, before, and after. Each row has a `version` counter for optimistic checks.

### 3.4 Transactional entities

| Entity | Current state | Audit |
|---|---|---|
| Booking | `status`, `paymentStatus`, `cancelledAt`, `cancelledByType`, `cancelledById`, `cancelReason` | Event on every transition |
| BookingItem | `status` | Event on every transition, inside the booking's transaction |
| Payment | `status`, `succeededAt`, failure fields | Event on every transition |
| Refund | `status`, `requestedById` (admin, or null for policy-driven) | Event on creation and completion |
| Quote | `consumedAt` | Event when consumed (booking created) |
| WebhookEvent | `processedAt`, `attempts` | Immutable input record; not an audit event |

### 3.5 `AuditEvent` contract

Columns: `occurredAt`, `actorType` (`SYSTEM | USER | GUEST | ADMIN | PROVIDER`), `actorId`, `action` (dotted name, e.g. `booking.confirmed`, `payment.failed`, `refund.succeeded`, `inventory.adjusted`, `rate.updated`, `policy.updated`, `admin.role_changed`), `aggregateType`, `aggregateId`, `before` JSON, `after` JSON, `requestId`, `ipAddress`.

Rules:
- Written in the same transaction as the state change. If the audit insert fails, the change rolls back.
- Append-only. The migration revokes `UPDATE` and `DELETE` from the application role and adds a trigger that raises an exception on either.
- Financial events retained for 7 years (confirm with finance). Partition by month when volume requires.
- Read by admins only (`audit:read` permission).

---

## 4. Availability and concurrency

### 4.1 The rule that prevents overselling

Every change to a stock counter is a **single SQL statement that both checks and changes the counter**, guarded by this invariant, which the database also enforces with a CHECK constraint:

```
sold + held + blocked <= total
```

The application never reads a count and then writes. Two requests cannot both pass a check they performed separately, because check and write are one atomic statement under a row lock.

Counter transitions (each is one guarded statement):

| Transition | Units move | Guard |
|---|---|---|
| Hold | free to held | `total − sold − held − blocked ≥ n` |
| Confirm (payment succeeds) | held to sold | `held ≥ n` |
| Release (hold expired or abandoned) | held to free | `held ≥ n` |
| Cancel confirmed | sold to free | `sold ≥ n` |
| Late confirm (hold already lost) | free to sold | `total − sold − held − blocked ≥ n` |
| Admin total change | total changes | new total ≥ sold + held + blocked |

Each transition changes `sold + held` by exactly the amount its guard checked, so the invariant holds after every commit.

### 4.2 Transaction and locking rules

- Isolation: `READ COMMITTED`. Each guarded statement is evaluated against the latest committed row under its lock, so `SERIALIZABLE` is not needed and is not used.
- **Lock order** (prevents deadlocks): `Quote`, then `Booking`, then inventory rows; inventory rows in ascending `(resource, date)`. Every transaction that touches several rows follows this order.
- Multi-night statements first take the locks with `SELECT … ORDER BY date FOR UPDATE`, then apply the guarded `UPDATE`. The `UPDATE` must affect exactly the expected number of rows; otherwise the transaction rolls back.
- `SET LOCAL lock_timeout = '3s'` and `statement_timeout = '5s'`. A lock timeout returns `409 RETRY`; the client may retry the same quote.
- Counter changes are relative (`col = col + n`), never read-modify-write in application code.

### 4.3 Hotel room nights: hold

Stay `[checkIn, checkOut)`, `r` rooms, `n` nights, room `R`. Holds are per night.

```sql
BEGIN;
SET LOCAL lock_timeout = '3s';

-- 1. Consume the quote (single use). Locks the quote row.
UPDATE "Quote" SET "consumedAt" = now()
 WHERE id = $quote AND "consumedAt" IS NULL AND "expiresAt" > now();
-- rowcount 0: ROLLBACK, then SELECT Booking WHERE quoteId = $quote.
--   not found -> 410 QUOTE_EXPIRED or 409 QUOTE_USED. Replay is handled by IdempotencyKey (Revision 4)

-- 2. Lock the nights in ascending order.
SELECT date FROM "RoomInventory"
 WHERE "roomId" = $R AND date >= $in AND date < $out
 ORDER BY date FOR UPDATE;
-- fewer than n rows: ROLLBACK, 422 NOT_AVAILABLE (a missing row means the night is not sold)

-- 3. Guarded hold on every night.
UPDATE "RoomInventory"
   SET "heldUnits" = "heldUnits" + $r, version = version + 1
 WHERE "roomId" = $R AND date >= $in AND date < $out
   AND "totalUnits" - "soldUnits" - "heldUnits" - "blockedUnits" >= $r;
-- rowcount must equal n, else ROLLBACK and 409 SOLD_OUT

-- 4. Create the order (new rows, invisible to others until commit).
INSERT INTO "Booking" (..., status, "holdMinutes", "holdExpiresAt", ...)
VALUES (..., 'PENDING_PAYMENT', $holdMinutes, now() + make_interval(mins => $holdMinutes), ...);
INSERT INTO "BookingItem" (..., "hotelId", "roomId", "ratePlanId", status) VALUES (..., 'HELD');

-- 5. Audit, same transaction.
INSERT INTO "AuditEvent" (...) VALUES (..., 'booking.held', 'Booking', $booking, ...);
COMMIT;
```

Why two concurrent requests for the last room cannot both succeed: both must lock the same `RoomInventory` rows in step 2. The second waits. When the first commits, the second re-evaluates `total − sold − held − blocked ≥ r` in step 3 against committed counts, fails, and rolls back. A partial hold (some nights updated, one night full) is impossible, because the rowcount check rolls back the whole statement set.

Confirm and release follow in sections 4.8 and 4.9.

### 4.4 Tour departures

`TourSession` is one row per departure, so one guarded statement suffices:

```sql
UPDATE "TourSession"
   SET "heldUnits" = "heldUnits" + $p, version = version + 1
 WHERE id = $s AND status = 'OPEN'
   AND "bookedUnits" + "heldUnits" + $p <= capacity;
-- rowcount must be 1; else 409 SOLD_OUT
```

- Confirm: `SET "heldUnits" = "heldUnits" − $p, "bookedUnits" = "bookedUnits" + $p WHERE id = $s AND "heldUnits" >= $p`
- Release: `SET "heldUnits" = "heldUnits" − $p WHERE id = $s AND "heldUnits" >= $p`
- Cancel confirmed: `SET "bookedUnits" = "bookedUnits" − $p WHERE id = $s AND "bookedUnits" >= $p`

The row lock on the single session row serialises every booking for that departure.

### 4.5 Cars (branch and day)

Rental of `d` days from pick-up date `D` consumes days `D … D+d−1` at the pick-up branch `L`. Same pattern as hotels, on `CarInventory(carModelId, locationId, date)` with `heldUnits`, `bookedUnits`, `blockedUnits`. V1 supports same-branch return only. One-way rentals need guarded counters at the return branch too (V1.1).

### 4.6 Transfers (vehicle class and day)

`TransferCapacity(vehicleClassId, date)` holds the day's vehicle count. One transfer consumes one unit on its pick-up date:

```sql
UPDATE "TransferCapacity"
   SET "heldUnits" = "heldUnits" + 1, version = version + 1
 WHERE "vehicleClassId" = $c AND date = $d
   AND "bookedUnits" + "heldUnits" + 1 <= "totalUnits";
-- rowcount must be 1
```

Limitation (documented): day-level counts do not model time-of-day clashes. Time-slot capacity is a V1.1 change to the key, not to the pattern.

### 4.7 Packages (allotment)

`PackageDeparture` holds `heldTravellers` and `bookedTravellers` with `capacity = maxTravellers`. A booking for `t` travellers:

```sql
UPDATE "PackageDeparture"
   SET "heldTravellers" = "heldTravellers" + $t, version = version + 1
 WHERE id = $d AND status = 'OPEN'
   AND "bookedTravellers" + "heldTravellers" + $t <= capacity;
```

V1 does **not** reserve the package's hotel rooms, tour sessions, or vehicles separately. Admins size each departure's allotment to the component stock they have arranged. This is a deliberate simplification: packages become one counter. V1.1 adds `PackageComponent` and reserves component stock in the same transaction. Until then, over-allotment is an operational risk (section 19, Q8).

### 4.8 Lifecycle scenarios

**A. Payment succeeds within the hold** (webhook processing):

```sql
BEGIN;
-- dedupe the provider event
INSERT INTO "WebhookEvent" (..., "providerName", "providerEventId", ...)
  ON CONFLICT ("providerName", "providerEventId") DO NOTHING RETURNING id;
-- no row: already received. If processedAt is set, COMMIT and return 200. Otherwise continue (retry).

-- lock the booking first (lock order)
SELECT id, status, "holdExpiresAt" FROM "Booking" WHERE id = $b FOR UPDATE;

-- mark the payment final, only once
UPDATE "Payment" SET status = 'SUCCEEDED', "succeededAt" = now(), "providerPaymentId" = $pid
 WHERE id = $p AND status IN ('PENDING', 'REQUIRES_ACTION') RETURNING id;
-- no row: already final, skip the transition and still mark the webhook processed

-- within the hold: held to sold per night (guard held >= r)
UPDATE "RoomInventory"
   SET "heldUnits" = "heldUnits" − $r, "soldUnits" = "soldUnits" + $r, version = version + 1
 WHERE "roomId" = $R AND date >= $in AND date < $out AND "heldUnits" >= $r;   -- rowcount = n
UPDATE "BookingItem" SET status = 'CONFIRMED' WHERE "bookingId" = $b AND status = 'HELD';
UPDATE "Booking" SET status = 'CONFIRMED', "paymentStatus" = 'PAID', "confirmedAt" = now(), version = version + 1
 WHERE id = $b AND status = 'PENDING_PAYMENT';
INSERT INTO "AuditEvent" (...) VALUES (..., 'payment.succeeded', ...), (..., 'booking.confirmed', ...);
UPDATE "WebhookEvent" SET "processedAt" = now() WHERE id = $w;
COMMIT;
```

**B. Payment succeeds after the hold has passed.** The money arrived late, but the expiry job may not have run yet. Inside the same transaction, after the booking lock:

1. If `status = PENDING_PAYMENT` and `holdExpiresAt <= now()`: run the release in 4.9 first (booking to `EXPIRED`, holds returned).
2. Then attempt a **late confirm** straight to sold, guarded by free capacity:

```sql
UPDATE "RoomInventory"
   SET "soldUnits" = "soldUnits" + $r, version = version + 1
 WHERE "roomId" = $R AND date >= $in AND date < $out
   AND "totalUnits" - "soldUnits" - "heldUnits" - "blockedUnits" >= $r;   -- rowcount = n
```

- Success: items to `CONFIRMED`, booking `EXPIRED` to `CONFIRMED` (this transition is allowed only on this path), `paymentStatus = PAID`. Audit `booking.late_confirmed`.
- Failure (sold out in the meantime): booking stays `EXPIRED`. A `Refund` row for the full amount is created with reason `late_payment_unfulfilled` (`PENDING`). `paymentStatus` stays `PAID` until the refund succeeds. Audit `booking.late_payment_unfulfilled`. Nothing is oversold, and the customer is never left paid-but-unfulfilled without a refund in progress.

**C. Payment fails.** No inventory change; the hold stays so the customer can retry.

```sql
BEGIN;
SELECT id FROM "Booking" WHERE id = $b FOR UPDATE;
UPDATE "Payment" SET status = 'FAILED', "failureCode" = $code, "failureMessage" = $msg
 WHERE id = $p AND status IN ('PENDING', 'REQUIRES_ACTION');
UPDATE "Booking" SET "paymentStatus" = 'FAILED', version = version + 1
 WHERE id = $b AND status = 'PENDING_PAYMENT';
INSERT INTO "AuditEvent" (..., 'payment.failed', ...);
COMMIT;
```

A retry is a new `Payment` row with a new `idempotencyKey`, allowed while the booking is `PENDING_PAYMENT` and not expired. A failure never releases capacity; only expiry or cancellation does.

**D. Abandoned checkout.** The customer never pays. The booking stays `PENDING_PAYMENT` with units held. Nothing else happens until `holdExpiresAt`, when the expiry job (4.9) releases the units. The quote's TTL is separate: it only decides whether a quote can still create a booking.

**E. Cancellation of a confirmed booking.**

```sql
BEGIN;
SELECT id, status FROM "Booking" WHERE id = $b FOR UPDATE;      -- booking lock first
-- per night: release sold
UPDATE "RoomInventory" SET "soldUnits" = "soldUnits" − $r, version = version + 1
 WHERE "roomId" = $R AND date >= $in AND date < $out AND "soldUnits" >= $r;   -- rowcount = n
UPDATE "BookingItem" SET status = 'CANCELLED' WHERE "bookingId" = $b AND status = 'CONFIRMED';
UPDATE "Booking" SET status = 'CANCELLED', "cancelledAt" = now(), "cancelledByType" = $actor,
       "cancelledById" = $user, "cancelReason" = $reason, version = version + 1
 WHERE id = $b AND status = 'CONFIRMED';
-- refund per the snapshot rules (section 7.5); insert Refund(PENDING) if amount > 0
INSERT INTO "Refund" (...) VALUES (...);
INSERT INTO "AuditEvent" (..., 'booking.cancelled', ...), (..., 'refund.requested', ...);
COMMIT;
```

**F. Admin changes capacity.** `UPDATE "RoomInventory" SET "totalUnits" = $new WHERE … AND $new >= "soldUnits" + "heldUnits" + "blockedUnits"`. Reducing total below sold or held is refused; the admin must cancel or wait. Audit records before and after.

### 4.9 Hold release job (expiry)

Runs every minute, one process at a time (advisory lock on the job name).

```sql
-- candidate selection; skip bookings another transaction is paying for right now
SELECT id FROM "Booking"
 WHERE status = 'PENDING_PAYMENT' AND "holdExpiresAt" < now()
 ORDER BY "holdExpiresAt" LIMIT 100
 FOR UPDATE SKIP LOCKED;

-- per booking, in its own transaction:
BEGIN;
UPDATE "Booking" SET status = 'EXPIRED', version = version + 1
 WHERE id = $b AND status = 'PENDING_PAYMENT' AND "holdExpiresAt" < now()
 RETURNING id;                       -- no row: ROLLBACK (another path won)
-- for each HELD item, release (guarded):
UPDATE "RoomInventory" SET "heldUnits" = "heldUnits" − $r, version = version + 1
 WHERE "roomId" = $R AND date >= $in AND date < $out AND "heldUnits" >= $r;   -- rowcount = n
UPDATE "BookingItem" SET status = 'EXPIRED' WHERE "bookingId" = $b AND status = 'HELD';
INSERT INTO "AuditEvent" (..., 'booking.expired', ...);
COMMIT;
```

Why this is safe against a payment racing it: both take the booking row lock first. Whichever commits first wins. If expiry commits first, the payment's step 1 sees `EXPIRED` and takes the late path. If the payment commits first, the booking is `CONFIRMED` and expiry's `WHERE status = 'PENDING_PAYMENT'` matches nothing. `SKIP LOCKED` lets the job move on instead of queueing behind a live payment.

Failure safety: if the process dies mid-job, the transaction rolls back and the booking remains `PENDING_PAYMENT` with a past `holdExpiresAt`, so the next run retries. Nothing is half-released. An alert fires if any booking is overdue by more than five minutes.

### 4.10 Hold duration

`booking.holdMinutes` is read from `Setting` at booking creation and stored on `Booking.holdMinutes`. Changing the setting affects only new bookings. Default 15. A different duration per product type (for example longer for pay-later packages) needs a setting value, not a schema change.

### 4.11 Invariant summary

- **Never oversold:** every decrement of free capacity is a guarded statement under a row lock.
- **Never double-counted:** each counter move is in the same transaction as the state change that justifies it, with an event row.
- **Never lost:** a failed step rolls back the whole transaction, holds included.
- **Never stuck:** holds expire by time, not because a process happens to be alive.

---

## 5. Booking model

- **Order:** `Booking` with one `BookingItem` per product (V1 enforces one item; the schema allows several).
- **Idempotency:** `Booking.quoteId` is unique and the quote is consumed in the creating transaction. Replaying the same request returns the same booking. A new quote is a new booking.
- **Guest checkout:** `userId` nullable. `customerEmail` plus reference is the lookup key for guests.
- **Customer snapshot:** name, email, phone, and country are copied to the booking. Later account edits do not alter it.
- **Party:** `BookingItem.adults` and `children`, and `quantity` (rooms, participants, travellers; 1 for cars and transfers). Traveller names are not collected in V1.
- **Typed keys:** nullable FKs on `BookingItem`, one set per product: hotel `hotelId, roomId, ratePlanId`; tour `tourId, tourSessionId`; car `carModelId, pickupLocationId`; transfer `transferRateId`; package `packageDepartureId`. Each product's CHECK (exactly its keys non-null) is in the migration plan.
- **Price:** `subtotal`, `discount`, `tax`, `fee`, `total` in `currency`. `priceBreakdown` JSON holds every line with rule code, percent or flat, original amount and currency. `displayCurrency` and `displayFxRate` are for presentation only.
- **Status:** `PENDING_PAYMENT` to `CONFIRMED` to `COMPLETED` (completed is derived after the end date, not a user action), or to `CANCELLED`, or to `EXPIRED`. `EXPIRED` to `CONFIRMED` happens only through the late path (4.8B).
- **Payment status:** `UNPAID | PENDING | PAID | PAY_LATER | FAILED | PARTIALLY_REFUNDED | REFUNDED`.

---

## 6. Pricing

### 6.1 Principles

- The server is the only source of money values. Booking takes a `quoteId`.
- Prices are stored in their own currency, with a currency column. The quote converts each line into the requested currency using a snapshotted rate.
- Arithmetic is decimal, rounded half-up to the currency's minor units. ISO 4217 exponents are a standard, not a business constant, so they live in code.
- Tax and fee rates are `PricingRule` rows. FINANCE edits them; they are versioned by `validFrom` and `validTo`.

### 6.2 Adjustment order

1. Base lines (per product, section 6.3)
2. Surcharges (for example young-driver, `SURCHARGE`)
3. Discounts (`DISCOUNT` kind, reserved; none active in V1)
4. `subtotal` = sum of lines after steps 2 and 3
5. Taxes: each active `TAX` rule matching the product type, percent times subtotal, rounded per rule
6. Fees: each active `FEE` rule, percent times subtotal, or flat
7. `total` = subtotal + taxes + fees

Prices are tax-exclusive. The quote shows each tax and fee as its own line with its code and rate.

### 6.3 Occupancy and guest rules by product

**Hotels.** A room has `baseOccupancy`, `maxAdults`, `maxChildren`. A rate plan has `basePricePerNight` (for `baseOccupancy` adults), `extraAdultPerNight`, `extraChildPerNight`. Per room, per night:

```
roomNight = nightlyRate(date)                          -- RoomRate override, else basePricePerNight
          + max(0, adultsInRoom − baseOccupancy) × extraAdultPerNight
          + childrenInRoom × extraChildPerNight
```

Validation: `adultsInRoom ≤ maxAdults` and `childrenInRoom ≤ maxChildren`. If an extra rate is null and the room would need it, the rate plan is not offered for that party. It is omitted, never priced at zero. Guests are split across rooms by the engine: adults and children as evenly as possible, earlier rooms taking remainders. Line amount is the sum over nights and rooms. Quantity is the number of rooms.

**Tours.** `pricePerPerson × participants`, or the session override. Participants must fit within `maxGroupSize` minus held and booked units. Child pricing is not in V1: one price per participant.

**Cars.** `pricePerDay × d`, where `d = ceil((dropoffAt − pickupAt) / 24h)`, minimum 1. Pick-up and drop-off are the same branch in V1. Driver age must be at least `CarModel.minDriverAge` (default 21, per model, not hard-coded), or the offer is refused. Young-driver surcharge: a `SURCHARGE` rule with conditions `{"driverAgeBelow": 25, "perDay": true}` and a flat amount.

**Transfers.** `TransferRate.amount` for the origin and destination pair and vehicle class. Party limits: `passengers ≤ passengersMax`, `luggage ≤ luggageMax`. One price per transfer, not per person.

**Packages.** `Package.pricingBasis` determines the line:

| Basis | Line amount | Parameters |
|---|---|---|
| `PER_PERSON` | `basePrice × adults + childPrice × children`, plus `singleSupplement` when exactly one traveller is in the party | `childPrice` nullable (null = children not offered); `minTravellers ≤ travellers ≤ maxTravellers` |
| `PER_ROOM` | `basePrice × rooms + extraPersonPrice × max(0, travellers − 2 × rooms)` | Request includes `rooms`; base occupancy is 2 per room |
| `PER_PACKAGE` | Flat `basePrice` for `minTravellers ≤ travellers ≤ maxTravellers` | No per-person component; the group is priced as one |

`PackageDeparture.priceOverride` (with its own currency) replaces `basePrice` for that departure. The `startingPrice / 2` assumption is gone. Any per-traveller figure shown in the UI is derived from the basis.

### 6.4 Multi-currency

- Each price row has `currency`. A quote may mix currencies across lines (for example a USD tour and an EGP hotel). Each line is converted to the quote currency.
- `ExchangeRate(baseCurrency, quoteCurrency, rate, fetchedAt)`. Conversion is `amount × rate`, rounded. The rate used is stored on each line in `lines` JSON, so quotes and bookings are reproducible.
- The base currency is a `Setting` (`EGP` initially). The booking's `currency` is its settlement currency. Whether the provider can settle in a non-EGP currency is an open question (Q2).
- Display currency: `Booking.displayCurrency` and `displayFxRate` are a presentation snapshot. The legal total is in `currency`.

### 6.5 Rounding

Each line is rounded once, to its currency's minor units. Taxes and fees are computed on the rounded subtotal, and each rule is rounded separately. Totals are sums of rounded parts, so the displayed breakdown always adds up exactly. Tests cover EGP and USD (2 decimals) and a zero-decimal currency.

---

## 7. Payments

### 7.1 Provider-agnostic contract

The application talks to a `PaymentProvider` interface (code, not schema) with four operations: `createPaymentSession(booking, amount, currency, idempotencyKey)`, `parseWebhook(rawBody, headers)`, `verifySignature(rawBody, headers)`, and `refund(providerPaymentId, amount, idempotencyKey)`. Each provider is an adapter. `Payment.providerName` selects the adapter. Adding a provider means writing an adapter, not a migration.

### 7.2 Hosted or tokenised fields only

The browser sends card data **only to the provider's hosted fields or redirect page**, which returns a session reference or token. Our servers receive:

- a provider payment reference (`providerPaymentId`),
- card brand, last four digits, and expiry (permitted to store under PCI DSS),
- a failure code and message.

We never receive the card number, CVC, or magnetic-stripe data. This keeps us in the lightest PCI scope.

### 7.3 Payment states

`Payment.status`: `PENDING`, then `REQUIRES_ACTION` (for example 3-D Secure), then `SUCCEEDED`, `FAILED`, or `CANCELLED`. Transitions are guarded `UPDATE … WHERE status IN (…)`, so repeated webhooks are no-ops.

Each attempt is a new `Payment` row with its own `idempotencyKey` (unique per booking). Creating a session twice with the same key returns the same session.

### 7.4 Webhooks

- Endpoint `POST /webhooks/payments/:providerName`.
- Verify the signature on the raw body before parsing. Reject unsigned events and events older than five minutes.
- Insert into `WebhookEvent` with `(providerName, providerEventId)` unique. A duplicate delivery is recognised and acknowledged.
- Processing runs in the transactions of section 4.8. A `WebhookEvent` whose processing fails is retried by a job with `attempts` incremented. After N attempts it raises an alert.
- The HTTP response is returned after the event is stored, not after business processing, so provider retries do not pile up.

### 7.5 Refunds

- A `Refund` row is created by a cancellation (policy-driven) or by an admin action (`requestedById`).
- The amount comes from the **booking's snapshot** of the cancellation policy and the time to start at the moment of cancellation, not from the current policy.
- Refund statuses: `PENDING`, then `SUCCEEDED` or `FAILED`. A failed refund is retried, then escalated to FINANCE.
- `Booking.paymentStatus` becomes `PARTIALLY_REFUNDED` or `REFUNDED` when succeeded refunds reach the captured amount. This is computed inside the refund-completion transaction, with the booking locked first.

### 7.6 Pay later

Allowed for the product types listed in `Setting['payment.payLaterProductTypes']` (initially `HOTEL` and `PACKAGE`). The booking is confirmed immediately: units go straight to sold, with no hold. `paymentStatus = PAY_LATER`, `paymentMethod = PAY_LATER`, and no `Payment` row is created. If a deposit is introduced later, it is a `Payment` with its own provider reference.

---

## 8. Authentication

Principles unchanged from revision 1, with simpler tables:

- Access token: JWT, 10 minutes, EdDSA, held in memory by the frontend.
- Refresh token: opaque 32 bytes in an `HttpOnly; Secure; SameSite=Strict` cookie, path `/auth`. Stored as SHA-256 in `AuthToken(type = REFRESH, familyId, replacedById)`. Rotated on each use; reuse of a rotated token revokes the family.
- Verify-email and password-reset tokens are `AuthToken` rows: hashed, single use, 24 hours and 30 minutes respectively.
- Argon2id for passwords. Login returns the same timing and message for unknown and wrong-password cases. Five failures lock the account for 15 minutes.
- Guest checkout needs no account. Email verification is offered after booking.

---

## 9. Roles and permissions

| Role | Scope |
|---|---|
| CUSTOMER | Own profile, favorites, own bookings |
| SUPPORT | Read any booking, cancel per policy, read users, add booking notes (recorded as AuditEvent) |
| CONTENT_EDITOR | Catalogue content and media. Cannot edit prices, rules, or money |
| FINANCE | Prices (rates, transfer rates, package prices), pricing rules, exchange rates, refunds, payment reads |
| ADMIN | Everything, including user role changes and audit reads |

Permissions are code constants mapped to roles. Writes that touch money or inventory require the specific permission and produce an `AuditEvent` with before and after.

---

## 10. Settings (runtime configuration)

| Key | Default | Use |
|---|---|---|
| `booking.holdMinutes` | 15 | Hold duration, copied to each booking |
| `quote.ttlMinutes` | 15 | Quote validity |
| `currency.base` | `EGP` | Base currency for ExchangeRate |
| `currency.display` | `["EGP","USD","EUR"]` | Offered display currencies |
| `payment.payLaterProductTypes` | `["HOTEL","PACKAGE"]` | Pay-later eligibility |
| `booking.guestCheckoutEnabled` | `true` | Feature gate |

Changes write an `AuditEvent` (`setting.updated`).

---

## 11. API (revision 2 changes applied)

Conventions: `/api/v1`, JSON, RFC 9457 problem responses with stable error codes. Money: `{ "amount": "6800.00", "currency": "EGP" }`. Pagination: cursor for lists; offset capped at 50 for catalogue lists.

Idempotency:
- `POST /bookings` takes `quoteId`. **No `Idempotency-Key` header** is needed, because the quote is the key.
- `POST /bookings/:ref/payments` requires `Idempotency-Key`, one per payment attempt.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` | As revision 1 |
| GET / PATCH | `/users/me`, `/users/me/preferences`; PUT `/users/me/password` | Preferences: `language`, `currency` |
| GET | `/destinations`, `/destinations/:slug` | |
| GET | `/locations`, `/locations/search?q=` | The only way to resolve free text |
| GET | `/hotels` | Filters as revision 1; `fromPrice` from `Hotel.fromPriceAmount` |
| GET | `/hotels/:idOrSlug` | |
| GET | `/hotels/:id/rooms?checkIn&checkOut&adults&children&rooms` | Offers with rate plans, per-room occupancy price, and availability count. Advisory; does not reserve |
| GET | `/tours`, `/tours/:idOrSlug`, `/tours/:id/sessions?from&to&participants` | |
| GET | `/cars?pickupLocationId&pickupAt&dropoffAt&driverAge&…` | Same-branch return enforced in V1; a different `dropoffLocationId` is rejected |
| GET | `/cars/:idOrSlug` | |
| GET | `/transfers/vehicle-classes` | |
| POST | `/transfers/quotes` | Body with `originLocationId`, `destinationLocationId`, `pickupAt`, `passengers`, `luggage`. Free-text addresses are rejected in V1 with `422 LOCATION_REQUIRED` |
| GET | `/packages`, `/packages/:idOrSlug`, `/packages/:id/departures?from&to&travellers` | |
| POST | `/quotes` | Body `{productType, productId, selection}`. Returns lines, totals, `expiresAt`; stores a `Quote` |
| GET | `/quotes/:id` | Owner, or the guest holding the quote id |
| POST | `/bookings` | Body `{quoteId, customer{…}, specialRequests?}`. Returns `201` with `PENDING_PAYMENT` (card) or `CONFIRMED` (pay later). Errors: `409 SOLD_OUT`, `409 RETRY`, `410 QUOTE_EXPIRED`, `409 QUOTE_USED`, `422 PAY_LATER_NOT_ALLOWED` |
| GET | `/bookings` (auth) | Grouped by status |
| GET | `/bookings/:reference` (owner, or guest with `?email=`) | Same `404` for wrong owner and missing booking |
| POST | `/bookings/:reference/cancel` | Returns refund preview from the snapshot rules |
| GET | `/bookings/:reference/voucher` | PDF |
| POST | `/bookings/:reference/payments` | Body `{method: "CARD", returnUrl}`; header `Idempotency-Key`. Returns the provider session |
| GET | `/bookings/:reference/payments` | Sanitised |
| POST | `/webhooks/payments/:providerName` | Signature-verified, raw body |
| GET / PUT / DELETE | `/favorites`, `/favorites/:productType/:productId`; POST `/favorites/sync` | |
| Admin | `/admin/...` | Content CRUD; `PUT` for inventory and rates by date range; `PUT /admin/pricing-rules/:id`; `POST /admin/bookings/:ref/refunds`; `GET /admin/audit-events`; `PATCH /admin/settings/:key` |

Removed from revision 1: `/bookings/items/:id/review`, `/reviews/featured`, `/users/me/reviews`, `/hotels/:id/reviews` (deferred with `Review`). Traveler arrays are removed from `POST /bookings`.

---

## 12. Frontend service to API to database mapping

| Frontend service | API | Entities | Change for the UI |
|---|---|---|---|
| `hotels.getHotels` | `GET /hotels` | Hotel, Destination, Media, RatePlan | `pricePerNight` becomes `fromPrice` with currency |
| `hotels.getHotelById` | `GET /hotels/:id` | Hotel, Media | `location` string becomes address plus destination |
| `hotels.getRoomsForHotel` | `GET /hotels/:id/rooms` | Room, RatePlan, RoomRate, RoomInventory | Refundable moves to rate plan; offers replace the room array |
| `tours.getTours` | `GET /tours` | Tour, TourSession | `fromPrice` derived |
| `tours.getTourById` | `GET /tours/:id` + `/sessions` | Tour, TourSession | `availableDates` and `startTimes` become sessions |
| `cars.getCars` | `GET /cars` | CarModel, CarInventory, Location | Requires a location and dates |
| `cars.getCarById` | `GET /cars/:id` | CarModel, Media | `mileageIncluded` becomes `includedKmPerDay` |
| `transfers.getTransferVehicles` | `GET /transfers/vehicle-classes` | TransferVehicleClass | |
| `transfers.getAirports` | `GET /locations?type=AIRPORT` | Location | |
| Transfer price (`buildTransferSummary`) | `POST /transfers/quotes`, then `POST /quotes` | TransferRate, TransferCapacity | Route selection replaces free-text addresses |
| `packages.getPackages` | `GET /packages` | Package, PackageDeparture | `budgetTier` has a source |
| `packages.getPackageById` | `GET /packages/:id` + departures | Package, PackageDeparture | Includes are descriptive JSON |
| `destinations.getDestinations` | `GET /destinations` | Destination | `listingsCount` is computed |
| `reviews.getReviews` | Deferred | none | Home keeps imported or static content in V1 |
| `bookings.getBookings` | `GET /bookings` | Booking, BookingItem | Tabs map to status groups |
| `bookings.getBookingByReference` | `GET /bookings/:ref` | Booking, BookingItem, Payment, Refund | Guest lookup needs the email |
| `user.getCurrentUser` | `GET /users/me` | User | |
| `lib/local-bookings` | `POST /bookings`, `GET /bookings`, cancel | Booking | Local storage removed |
| `lib/persistent` favorites | `/favorites` | Favorite | Synced on login |
| AppProvider session | `/auth/*` | User, AuthToken | In-memory token plus cookie |
| AppProvider currency and language | `PATCH /users/me/preferences` or query parameter | User | |
| `lib/currency` rates | `Quote.lines` snapshot; `GET /currency/rates` | ExchangeRate | |
| `lib/pricing` (all `build*Summary`) | `POST /quotes` | Quote, PricingRule | No client arithmetic |
| `CheckoutView` customer | `POST /bookings` | Booking, BookingItem | No traveller names in V1 |
| `CheckoutView` card | Provider hosted fields, then `POST /bookings/:ref/payments` | Payment | Card fields leave our page |
| Login, register, forgot password, profile | `/auth/*`, `/users/me*` | User, AuthToken | |
| Contact form | Not in V1 scope (open question) | none | |

---

## 13. Search

Unchanged in principle from revision 1. The changes:

- **Hotels:** `Hotel.fromPriceAmount` (cached cheapest rate plan, refreshed when rates change) drives the price filter and sort in SQL. Exact stay totals are computed in the service for the returned page only. Amenities use array containment on a GIN index.
- **Availability in SQL:** rooms where every night in `[checkIn, checkOut)` has `total − sold − held − blocked ≥ rooms`, grouped by room with `HAVING count(*) = nights`.
- **Cars:** the same `GROUP BY … HAVING count = days` on `CarInventory` at the pick-up branch.
- **Tours:** open sessions in the window with `capacity − booked − held ≥ participants`.
- **Packages:** `PackageDeparture` with enough free travellers; destination through the implicit join table.
- **Transfers:** route lookup by location pair, then capacity on `TransferCapacity`.
- Keyset pagination for price and rating sorts; offset only for small lists.
- `pg_trgm` GIN indexes on destination and hotel names and on location names.

---

## 14. Indexes (V1)

The schema declares these indexes. Each serves a named access pattern:

| Pattern | Index |
|---|---|
| Hotels by destination and price | `Hotel(destinationId, status, fromPriceAmount)` |
| Hotels by stars, guest rating | `Hotel(status, starRating)`, `Hotel(status, guestRatingAvg)` |
| Amenity containment | `Hotel(amenities)` GIN |
| Room nights for a stay | `RoomInventory` primary key `(roomId, date)` |
| Rates by date | `RoomRate` primary key `(ratePlanId, date)` |
| Tour sessions in a window | `TourSession(tourId, status, startsAt)`; unique `(tourId, startsAt)` |
| Car availability by branch and day | `CarInventory` primary key `(carModelId, locationId, date)`; `(locationId, date)` |
| Transfer routes | `TransferRate` unique `(origin, destination, vehicleClass, validFrom)` |
| Transfer capacity | `TransferCapacity` primary key `(vehicleClassId, date)` |
| Package departures | `PackageDeparture(packageId, status, startsOn)` |
| Booking by reference | `Booking.reference` unique |
| My bookings | `Booking(userId, createdAt)` |
| Expiry job | `Booking(status, holdExpiresAt)` |
| Guest lookup | `Booking(customerEmail, reference)` |
| Items by product (admin, reporting) | `BookingItem(productType, productId, status)` and per-key indexes |
| Payments by booking | `Payment(bookingId, status)`; unique `(bookingId, idempotencyKey)` |
| Webhook backlog | `WebhookEvent(processedAt)` |
| Favorites | Primary key `(userId, productType, productId)`; reverse `(productType, productId)` |
| Audit | `AuditEvent(aggregateType, aggregateId, occurredAt)`; `(actorId, occurredAt)` |

---

## 15. Media and storage

- One `Media` table with owner columns, a cover flag, and sort order. No link table.
- Originals in a private bucket. Variants (webp and avif at 400, 800, 1600 px) in a public prefix behind a CDN. Stored keys, not URLs.
- Presigned upload with size and MIME constraints; magic-byte check; EXIF stripped; ClamAV scan; no SVG.
- Imported images record `sourceUrl`, `attribution`, and `licenseCode`. Commons CC BY-SA attribution must be displayed.

---

## 16. Security (changes from revision 1)

- Passport numbers: never collected in V1. No column, no endpoint, no log field.
- Card data: never reaches our servers (hosted fields). Webhook signatures verified. Amounts reconciled to `Booking.total`.
- Price manipulation: booking takes only `quoteId`, and the quote is server-computed and single-use.
- Race conditions: section 4.
- IDOR: owner or guest-with-email checks in the service, identical 404 responses.
- Rate limits: auth, quotes, search, and booking creation (Redis token bucket).
- Audit trail immutability: revoked UPDATE and DELETE plus a trigger.
- Otherwise as revision 1: argon2id, rotating refresh cookies, Helmet, parameterised SQL only, no PII in logs, uniform auth responses, dependency scanning.

---

## 17. NestJS structure (V1)

```
src/
  config/        typed env; Setting loader
  common/        problem+json filter, pagination, money (minor units), time (Cairo zone)
  database/      PrismaService, soft-delete extension, migrations (with CHECK SQL)
  guards/        jwt, roles, ownership
  decorators/    current-user, roles, public
  interceptors/  serialization; audit helper that writes AuditEvent inside the transaction
  modules/
    auth/        login, refresh rotation, verify, reset
    users/       profile, preferences, password
    catalog/     destinations, locations, media (shared content module)
    hotels/      hotels, rooms, rate plans, room offers
    tours/       tours, sessions
    cars/        car models, branch availability search
    transfers/   vehicle classes, rates, capacity, transfer quotes
    packages/    packages, departures
    inventory/   guarded hold, confirm, release, cancel primitives used by all products
    pricing/     pure engine: lines, occupancy, rules, FX, rounding (no I/O)
    quotes/      quote creation and consumption
    bookings/    order creation, lifecycle, cancellation, vouchers
    payments/    provider adapters, sessions, webhooks, refunds
    favorites/
    settings/
    admin/       admin routers delegating to the modules above; audit reads
    scheduler/   hold release, webhook retry, quote cleanup, FX refresh
```

`inventory` is the single place where counter SQL lives, so the guard rules in section 4 are implemented and tested once. `pricing` is pure, so occupancy and rounding rules are unit-testable without a database.

---

## 18. Implementation order

1. Foundation: config, Prisma, migrations with CHECK SQL, append-only AuditEvent, seeds (`Setting`, and `PricingRule` rows for VAT and fee).
2. Auth and users.
3. Catalogue read APIs and admin CRUD for content.
4. Pricing engine and quotes: unit tests for every pricing basis and occupancy case, and rounding tests.
5. Inventory primitives and **concurrency tests against real PostgreSQL**. Parallel holds on the last room, last tour seat, last car, last transfer seat, and last package seat must produce exactly one winner. Also: expiry racing payment, payment failure followed by retry, duplicate webhook delivery.
6. Bookings: create (quote consumption), list, detail, cancel with refund preview.
7. Payments: one provider adapter (provider chosen later), webhooks, refunds, pay later.
8. Favorites; then reviews (V1.1).
9. Media pipeline and import.
10. Admin: inventory and rate editing, bookings and refunds, audit viewer, settings.
11. Hardening: load tests on search and hold paths, backup and restore drill.

---

## 19. Assumptions and open questions

Assumptions in force (confirm or change):

- A. One product per order in V1.
- B. Guest checkout enabled.
- C. Tax and fee rules are seeded with the values the frontend uses today (VAT 14%, service fee 3%). FINANCE confirms the real rates before launch. The code contains no rate.
- D. Prices are tax-exclusive.
- E. Hold duration 15 minutes (setting).
- F. Pay later only for hotels and packages (setting).
- G. Cars return to the pick-up branch in V1.
- H. Transfers are location-to-location in V1.

Questions:

1. Multi-product carts: needed in V1 or V1.1?
2. Which payment provider, and may charges settle in USD or EUR, or only EGP?
3. VAT and service fee: confirm the real rates, and whether the fee is shown separately or included in prices.
4. Young-driver surcharge amount, and minimum age per car category. The UI currently says 21 (25 for luxury), but the driver-age stepper allows 18.
5. Car rental day counting: 24-hour blocks from pick-up time, or calendar days?
6. Package pricing: which basis for each package, and what are the single-supplement and child rules? (The per-traveller figure is no longer assumed.)
7. Hotel occupancy: are children counted as occupants, or free?
8. Package component stock: are admins comfortable sizing allotments manually in V1, or must component reservation be automated before launch? Over-allotment is the main risk of the V1 design.
9. One-way car rentals: needed, and when?
10. Custom transfers to free-text addresses: acceptable to refuse them in V1 and offer location zones instead?
11. Refund policy: confirm the tiered snapshot structure. Should tours and transfers follow the same tiers?
12. Pay-later deposits: needed for hotels, or full payment on arrival only?
13. Reviews are deferred to V1.1. Is showing imported rating fields acceptable at launch?
14. Traveller names: needed at checkout for hotel or airline compliance? (Passport numbers remain out of scope.)
15. Time zone: all local times are Africa/Cairo. Confirm.
16. Arabic content: which fields need translation? The draft has `nameAr` only on destinations.
17. Retention: financial events kept for 7 years. Confirm with finance and legal.
18. Admin roles: are the five roles right, and who holds each?

---

## 20. Frontend changes implied (no UI redesign)

1. Replace local-storage bookings and the session with the APIs.
2. Replace every `build*Summary` call with `POST /quotes`.
3. Use location autocomplete; send location IDs for transfers and cars.
4. Use server pagination and filters; delete client-side list filtering once endpoints exist.
5. Replace the card form with the provider's hosted fields before any real payment.
6. Remove traveller-name fields for V1, or make them optional.
7. Display quote and booking totals from the API, including the tax and fee lines.

---

## 21. Revision 3 (approved changes, applied in Milestone 1)

- **Idempotency** is a separate mechanism from Quote. `IdempotencyKey(operation, key)` stores the request hash and the response, and is inserted in the same transaction as the business change, so a key exists only if its operation committed. Quote remains a price snapshot with single-use consumption. Used by booking creation and payment-session creation from Milestone 6.
- **Package manual allotment** is a documented V1 limitation. Packages have their own departure allotments; component hotel, tour, and transfer stock is not reserved. Component-level reservation is V1.1.
- **Driver age** is configurable per car model (`CarModel.minDriverAge`, no default in the schema; seeded to 21). Young-driver surcharges come from `PricingRule` only.
- **VAT and service fee** are `PricingRule` rows and are never hard-coded.
- **Transfer capacity** is per day. Time-slot capacity is deferred to V1.1.
- **Payments** remain provider-agnostic. Amounts are stored with currency columns.
- **Audit actor context**: `AuditEvent` stores `actorEmail`, `actorName`, and `actorRole` snapshots alongside `actorId` (no foreign key), so history stays readable after the account is deleted. Verified by integration test.
- **Database-enforced invariants**: inventory counters, money reconciliation, booking product keys, and the append-only audit trigger are migration SQL (`20261006202716_db_constraints_and_audit_immutability`).
- **Schema source of truth** moved to `backend/prisma/schema.prisma`. This file is a copy for review.


---

## 22. Revision 4 (approved decisions, applied in the cleanup before Milestone 3)

**Model count.** V1 has **32 models** and 27 enums. `IdempotencyKey` is the intentional 32nd model. Section 2 and the Revision 2 tables describe 31 and are superseded by this section.

**Idempotency is separate from Quote.**
- `Quote` is a price snapshot with an expiry. Its identity means "this price was calculated for this request". It is single-use through `consumedAt` only.
- `IdempotencyKey(operation, key)` means "this client request was already processed". It stores the request hash and the response, and is written in the same transaction as the business change.
- A retry of `POST /bookings` with the same key returns the stored response from `IdempotencyKey`. It does not depend on Quote state. Quote consumption then prevents the same price from being booked twice.

**Quote lifecycle.** Quotes are immutable after creation. The only permitted change is `consumedAt` going from NULL to a timestamp (Milestone 4). A database trigger enforces this. Quotes cannot be deleted through the application.

**Search and availability dates.** Any user-supplied start date (hotel check-in, tour date, session `from`, car pickup, transfer date, package date, departure `from`) must be today or later in the business time zone, Africa/Cairo. A past date returns 422. Date-only values are compared as calendar dates in that zone and are never converted through UTC first.

**Seed dates are rolling.** Tour sessions, package departures, and car, transfer and hotel inventory windows are computed from the Cairo business date at seed execution. Explicit past and expired fixtures are kept separately for visibility tests. Seeds remain idempotent.

**Development placeholders are marked.** `TransferRate.isDevPlaceholder` marks seeded transfer prices and durations, and quote lines show that status. These values are not confirmed business pricing.

**Field widening.** `CarModel.fuelPolicy` is widened from `VARCHAR(40)` to `VARCHAR(200)` so the full fuel-policy text is kept. This is an additive migration, not an edit of an applied one.

**Image licensing.** Licences are not claimed as verified. Commons files are `UNVERIFIED-COMMONS`. Production media will move to managed object storage with a CDN and per-asset licence metadata.

## 23. Revision 5 (approved decisions, applied in Milestone 5)

**No online gateway in V1.** `PaymentMethod.CARD` and `PaymentStatus.PAY_LATER` (standalone) remain in the schema as reserved values but are never produced by any code path. The only two methods a booking can actually be paid with are `CASH` and `INSTAPAY`, both settled manually, never through a card processor.

**Cash is pay-later, not pay-now.** Selecting `CASH` confirms the booking and converts its held inventory to sold immediately, but the `Payment` row stays `PENDING` — the schema's existing `PaymentState.PENDING` is reused to mean "money not yet collected", the same value `CARD` would have used for "not yet captured". An admin later records the cash as collected through a separate, idempotent action; only then does the `Payment` move to `SUCCEEDED` and the booking's `paymentStatus` to `PAID`.

**InstaPay is provider-agnostic manual verification.** `Payment.providerName`/`providerPaymentId` (built for a card gateway) are unused and nullable for `INSTAPAY`; the gateway-shaped columns are simply left `null` rather than removed, keeping the table's shape stable for a future real integration. `PaymentState.PENDING_VERIFICATION` and `REJECTED` are new values added specifically for this manual review flow. Each proof submission is its own `Payment` row — the model's original "a retry is a new Payment" design, extended unchanged from the card world to manual proofs, so a rejected attempt is kept as a permanent, reviewable record rather than overwritten by a resubmission.

**Payment proofs reuse the Media abstraction.** `MediaOwnerType.PAYMENT_PROOF` is a new value; `Media.ownerId` continues the existing polymorphic-reference-checked-in-the-service-layer pattern used by every other owner type, so no new foreign key or table was needed. Unlike every other `Media` row, a payment proof is never publicly readable — no public catalogue endpoint queries `PAYMENT_PROOF`, and the only read path is an access-controlled endpoint gated by booking ownership or admin role.

**Storage stays swappable.** Receipt files are written and read through a `FileStorage` interface with a single local-disk implementation for V1. Nothing in the payments module depends on the local implementation directly; a production deployment replaces it with one S3-compatible class and a one-line DI change.

**The hold-expiration scheduler needs no new infrastructure.** Section 2's original design left the scheduling mechanism unspecified. Milestone 5 wires it with a plain in-process `setInterval`, not a cron library or a queue: the guarded `WHERE status = 'PENDING_PAYMENT' AND holdExpiresAt < now` transition (Milestone 4) is the sole correctness authority regardless of how many application instances or overlapping ticks call it, so the scheduling layer itself carries no correctness burden and needs no distributed lock.
