# Milestone 7 report: Customer Frontend ↔ Backend Integration

All 14 stages (A–E) from the execution plan are complete. The customer-facing Next.js frontend
(previously 100% mock-data-driven) now talks to the real NestJS backend for every product category,
quote, booking, and payment flow. Two small, additive backend endpoints were needed (Section 7); no
schema or migration changes were required anywhere.

## 1. Integration matrix — pages to APIs

| Page / component | Backend APIs used |
|---|---|
| `/hotels`, `/hotels/[id]` | `GET /hotels`, `GET /hotels/:idOrSlug`, `GET /hotels/:idOrSlug/rooms` |
| `/tours`, `/tours/[id]` | `GET /tours`, `GET /tours/:idOrSlug`, `GET /tours/:idOrSlug/sessions` |
| `/cars`, `/cars/[id]` | `GET /cars`, `GET /cars/:idOrSlug`, `GET /locations?type=CAR_BRANCH` |
| `/transfers` | `GET /locations`, `GET /transfers/rates` |
| `/packages`, `/packages/[id]` | `GET /packages`, `GET /packages/:idOrSlug`, `GET /packages/:idOrSlug/departures` |
| `/favorites` | `GET /hotels`, `/tours`, `/cars`, `/packages` (favorite ids stay in client `localStorage`, unchanged) |
| `/checkout` | `POST /quotes`, `POST /bookings`, `POST /bookings/:ref/payment/cash`, `GET /payments/instapay-instructions`, `POST /bookings/:ref/payment/instapay` |
| `/booking/success`, `/my-bookings/[id]` | `GET /bookings/:idOrReference`, `GET /bookings/:idOrReference/payments` (new, Section 7), `POST /bookings/:idOrReference/cancel` |
| `/my-bookings` | `GET /bookings/mine` (new, Section 7) |
| Login/Register/Verify/Reset/Profile | `POST /auth/{login,register,refresh,logout,verify-email,forgot-password,reset-password}`, `GET/PATCH /users/me`, `PUT /users/me/password` |

Catalogue reads are always `cache: "no-store"` server-side fetches — an admin-published change
(Milestone 6) shows up on the next request, never only after a rebuild.

## 2. Catalogue integration

- `src/services/{destinations,hotels,tours,cars,transfers,packages,locations}.service.ts` were
  rewritten from static mock arrays to real fetches, mapped into the **same** frontend domain types
  (`Hotel`, `Room`, `Tour`, `Car`, `TravelPackage`, `Destination`) the existing listing/detail
  components already expected — so those 1800+ lines of UI needed no rewrite, only their data source
  changed.
- Each hotel room × rate plan pair becomes one sellable `Room` entry keyed by the rate plan's id —
  simultaneously the correct display model (price/refundability differ per rate plan) and the exact
  `productId` the quote API expects for a HOTEL selection.
- Tour and package booking widgets now fetch real bookable instances (`GET .../sessions`,
  `GET .../departures`) instead of the mock's flat `availableDates`/`startTimes` arrays, and pass the
  session/departure id through to checkout as the real `productId`.
- The car booking widget and the transfers page were rebuilt to use real `Location` records
  (`GET /locations`) instead of free-text pickup fields — the backend prices a car rental by a real
  `pickupLocationId` and a transfer by a real `(originLocationId, destinationLocationId)` pair, which
  a text input can't represent.
- `generateStaticParams` was removed from the hotel detail page (the only route that had it) so every
  catalogue detail page is fully dynamic, matching the admin-editable (Milestone 6) catalogue.
- All public pages only ever see published, eligible products — enforced server-side, unchanged from
  Milestones 2–3.

## 3. Quotes and checkout

`CheckoutView` was rewritten from client-side fake math (`lib/pricing.ts`, deleted — Section 10) to:

- Build a per-product `selection` object from the URL params set by each detail page's booking
  widget, matching the exact Milestone 3 zod schema for that product, and `POST /quotes`.
- Render the real line-item breakdown and totals from the quote response, plus a live countdown to
  `quote.expiresAt`. An expired quote disables submission and offers a "Refresh price" button that
  re-requests a quote; a 409/410 from booking creation (quote already consumed/expired) does the same
  automatically with an inline message.
- Collect customer details (prefilled and email-locked when signed in), then `POST /bookings` with a
  single `Idempotency-Key` generated once per attempt and reused across retries of that same attempt.
- On success, hand off to a shared `PaymentPanel` (Cash or InstaPay — no card, per the brief) instead
  of duplicating payment logic; `PaymentPanel` is reused unchanged on the booking detail page so a
  customer can also complete or retry payment there (Section 5).
- Never computes an authoritative total client-side. The only remaining client-side money math is the
  pre-existing "from price" currency-selector conversion, now explicitly scoped to non-authoritative
  browsing badges (`lib/currency.ts`'s `formatMoney`); every quote/booking amount is rendered via the
  new `formatExact(amount, currency)`, which prints the backend's own figure in its own currency,
  with the backend's own `quote.display` shown only as a secondary "≈" line when present.

## 4. Cash and InstaPay

- Cash: `PaymentPanel` calls `POST /bookings/:ref/payment/cash`; the resulting status is always read
  back from the server (`PAY_LATER`/`PENDING` → "Not yet collected"), never inferred client-side.
- InstaPay: fetches `GET /payments/instapay-instructions` for the recipient/handle/instructions text,
  collects a transfer reference and a receipt file, and `POST`s multipart with an `Idempotency-Key`.
  Client-side validation blocks submission without a file or with a too-short reference (verified live
  — Section 9). Status is shown as `PENDING_VERIFICATION` ("Pending verification"), never "Paid".
- Resubmission: the booking detail page shows the latest payment attempt; if it is `REJECTED`, the
  admin's rejection reason is shown and the same `PaymentPanel` reopens for a fresh InstaPay
  submission, eligible for as long as the booking itself stays `PENDING_PAYMENT`.
- Admin approval is reflected immediately: approving an InstaPay submission through the Milestone 6
  admin dashboard flips the booking to `CONFIRMED` / `PAID` on the very next customer-side fetch — no
  caching layer in between. Verified live end-to-end (Section 9).

## 5. Auth, guest checkout, My Bookings

- `AppProvider` now holds a real session: access token in `sessionStorage`, refresh token in the
  backend's own httpOnly cookie (never touched by JS), silent refresh attempted on mount.
- Login/Register/Forgot/Verify-email/Reset-password all call the real endpoints; registration shows a
  "check your email" screen instead of auto-signing in, since the backend requires verification first.
- `/my-bookings` requires sign-in (`GET /bookings/mine` has no guest path) and redirects to
  `/login?next=/my-bookings`, which signs in and returns to the original page.
- Guest checkout is fully preserved: a guest's booking success page links to
  `/my-bookings/:ref?email=...`, and every guest-facing read (booking detail, payment list, cancel)
  passes that email, matching the backend's existing owner-or-guest-email access rule.

## 6. UI states

Every integrated page handles loading (skeletons), empty results, API errors (inline, with retry where
it makes sense — e.g. "Refresh price", "Try again" on a failed quote), validation errors (field-level),
unavailable inventory (`NOT_AVAILABLE` quote errors surface as the quote error message), expired quotes
(countdown + disabled submit + refresh), unauthorized access (redirect or 404-shaped empty state, never
a hint that a booking exists under someone else's account), and success confirmation. No page falls
back to mock data on failure.

## 7. Backend additions (minimal, additive)

The brief authorized adding missing capabilities rather than faking a flow. Two were needed:

1. **`GET /bookings/mine`** (`bookings.controller.ts`/`.service.ts`/`.repository.ts`,
   `bookings.dto.ts`) — mandatory-auth (no `@OptionalAuth`, a guest has no persistent identity to list
   by), paginated, optional `status` filter. 3 new tests (`test/bookings/list-mine.e2e-spec.ts`):
   rejects unauthenticated, lists only the signed-in user's own bookings (never another user's or a
   guest's), paginates/filters.
2. **`GET /bookings/:idOrReference/payments`** (`payments.controller.ts`/`.service.ts`) — the
   customer's own payment attempts, same ownership rule as the existing cash/InstaPay write endpoints
   (signed-in owner, or guest with the booking's own email). Needed because the brief requires showing
   an InstaPay submission's live status and, on rejection, the admin's reason — and no customer-facing
   read of `Payment` rows existed before. Also added `rejectionReason` to the customer-facing
   `PaymentView` (previously admin-only). 6 new tests
   (`test/payments/list-for-booking.e2e-spec.ts`): empty list, cash as PENDING, InstaPay as
   PENDING_VERIFICATION with no reason, rejection reason surfaced after an admin rejects, wrong-owner
   access denied, signed-in owner access without an email.

No other backend code changed. Booking engine, inventory invariants, payment approval flow, and
pricing logic are all Milestone 3–6 code, reused unchanged.

## 8. Bugs found and fixed via live browser testing

Per the brief's instruction not to claim success from compilation alone, every flow below was driven
through a headless browser against the real running backend and Postgres `eb-dev` database (Section 9).
Three real bugs surfaced this way — none would have been caught by typecheck, lint, or a build:

1. **Session/departure date-window off-by-one.** `getTourSessions`/`getPackageDepartures` built a
   `[today, today + N days]` window for `MAX_SESSION_WINDOW_DAYS`/`MAX_DEPARTURE_WINDOW_DAYS`, which is
   `N + 1` *inclusive* calendar days — one over the backend's limit, so every tour/package booking
   widget's session list request failed with a 422 and the "Book Now" button stayed disabled. Fixed by
   using `(N - 1)` days.
2. **`pageSize` exceeding the backend's cap.** `locations.service.ts` and `bookings.service.ts`
   requested `pageSize: 100`, but every backend list endpoint caps `pageSize` at 50
   (`MAX_PAGE_SIZE`). This 422'd silently into a full page-level 500: the car detail page and the
   transfers page were completely broken (location picker never loaded), and `GET /bookings/mine`
   would have failed the same way for any signed-in user. Fixed by capping both at 50.
3. **`NaN Oct 2026` in booking detail dates.** `formatDate` assumed a plain `"YYYY-MM-DD"` string; a
   real `BookingItemView.startsAt`/`endsAt` is a full ISO datetime (`"2026-10-10T06:30:00.000Z"`),
   which broke the manual `"-"`-split parser. Fixed by taking only the first 10 characters before
   parsing — a one-line, backward-compatible fix.

## 9. Live end-to-end verification (browser + real backend + real DB)

Driven via headless browser against `localhost:3000`/`localhost:4000` with `eb-dev` Postgres, after the
fixes above:

- **Hotel, guest, Cash** — full flow: listing → detail → room selection → real quote
  (`EGP 29,000` subtotal, `EGP 33,930` total, 15-minute countdown) → booking created
  (`EB-1K0ZD50`) → cash selected → success page shows the real reference and "Not yet collected".
  Confirmed via `GET /bookings/:ref/payments` that the row is `CASH`/`PENDING`.
- **Tour, guest, InstaPay** — full flow including picking a real session from
  `GET /tours/:id/sessions`: submitting without a file is blocked client-side with the expected
  message; submitting with a file succeeds (`201`), booking shows "Awaiting payment" / "Not yet paid" /
  "InstaPay — Pending verification" — never "Paid".
- **Admin approval reflected in customer status** — logged in as the dev admin
  (`admin@egyptbeyond.example`), approved the InstaPay submission above through
  `POST /admin/payments/:id/approve`; reloading the customer's booking page immediately showed
  "Confirmed" / "Paid" / "InstaPay — Confirmed".
- **Car** and **Package** — real quotes confirmed load correctly (`EGP 1,931` / price-holds countdown
  for car; real departure-based quote for package) after the pageSize fix.
- **Transfer** — route (two real `Location`s) → real rate fetched from `GET /transfers/rates` →
  selected → real quote at checkout.
- **Security / authorization**, all against the live backend:
  - Unauthenticated `GET /my-bookings` → redirected to `/login?next=/my-bookings`.
  - A booking looked up with the wrong email, or no email and no auth → `404 NOT_FOUND` (never a hint
    the booking exists).
  - A forged booking-creation request (fake `quoteId`, a client-supplied `total` field) →
    `422 VALIDATION_FAILED` — the whitelist rejects the extra field before a fake quote id is even
    considered.
  - Cancelling someone else's booking, or listing someone else's payments, without the right email →
    `404 NOT_FOUND`.

Not independently re-driven through a live 15-minute wait: the quote-expiry UI (countdown reaching
zero, disabled submit, "Refresh price") was verified by code review against the already-tested backend
expiry behavior (`test/bookings/expiration.e2e-spec.ts`), not a real-time wait.

## 10. Removed dead code

Now-unreachable mock-era modules were deleted rather than left behind: `lib/pricing.ts`,
`lib/local-bookings.ts`, `lib/storage.ts`, `components/booking/BookingSummaryCard.tsx`,
`data/bookings.ts`, and the mock catalogue arrays (`data/{hotels,tours,cars,rooms,packages,
transfers,destinations}.ts`) that only `lib/pricing.ts` had referenced. The mock `Booking`/
`BookingStatus`/`PaymentStatus`/`CustomerInfo` types in `data/types.ts` were removed for the same
reason — every booking view now types against the real `BookingView`/`PaymentView` from
`lib/api/types.ts`.

## 11. Quality gate results

| Check | Result |
|---|---|
| Backend `npm run typecheck` | clean |
| Backend `npm run lint` | clean |
| Backend unit tests (`npm run test`) | 79/79 passed |
| Backend integration tests (`npm run test:integration`) | 365/365 passed, 39/39 suites (359 pre-M7 + 3 `list-mine` + 6 `list-for-booking` since M6) |
| Frontend `npx tsc --noEmit` | clean |
| Frontend `npx eslint .` | clean |
| Frontend `npm run build` | succeeds; every catalogue/detail/checkout/booking route is server-rendered on demand (ƒ), nothing admin-editable is statically frozen |
| Browser E2E (real backend + real `eb-dev` DB) | all 5 product types quoted successfully; hotel+tour fully booked end-to-end (cash and InstaPay); admin-approval reflected live; 6 security/authorization checks passed |

## 12. Known limitations / remaining production-readiness work

- **No automated frontend test suite.** No test runner is configured for the Next.js app (unchanged
  gap since Milestone 6); frontend correctness for this milestone rests on typecheck/lint/build plus
  the live browser E2E pass in Section 9, not an automated regression suite that runs in CI.
- **Email verification in dev.** `MAIL_TRANSPORT=log` means verification/reset emails are only visible
  in the backend process's own console output, not deliverable to a real inbox — a pre-existing dev
  environment limitation, unchanged by this milestone.
- **Quote-expiry UI** was verified by code review and the backend's own tested expiry behavior, not by
  a live 15-minute real-time wait (see Section 9).
- **Windows/Turbopack dev-server flakiness.** On this machine's `H:\` drive, `next dev` occasionally
  hits a transient `EPERM` renaming its own build manifest (a known Turbopack-on-network/slow-filesystem
  issue, flagged by Next.js itself at startup); it self-recovers on the next request and is unrelated
  to this milestone's code. Clearing `.next/dev` resolves it if it recurs.
- **Pre-existing `next/image` loader warning.** The custom `image-loader.ts` (predates this milestone)
  doesn't set a `width` on Wikimedia-sourced URLs, so the browser console logs a Next.js advisory
  warning for most seeded catalogue photos. Cosmetic only — images still render — and out of this
  milestone's scope (catalogue integration, not image-loader tuning).
- **No online/card payment**, by design, per the brief — Cash and InstaPay only.
- **Not independently re-tested**: duplicate-booking-request idempotency replay and out-of-stock
  (`NOT_AVAILABLE`) quote rejection were not separately re-driven live in this milestone's browser pass
  (both are covered by the existing, passing Milestone 3–4 backend test suites); a signed-in (not
  guest) full checkout end-to-end was exercised only for the Cash payment-listing ownership check
  (Section 7, test 6), not a full browser-driven signed-in purchase.

## Stop condition

Per the brief: stopping here. Milestone 8 has not been started, and nothing has been deployed.
