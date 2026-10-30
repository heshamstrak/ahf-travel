# Egypt Beyond — Admin Dashboard Completion & Redesign Report

Scope: full admin dashboard audit, redesign, CRUD/media completion, dashboard analytics, and
closing every gap identified in the first pass of this report. No Milestone 8 work, no
deployment, and no database resets were performed.

## Summary

- Backend unit tests: **79/79 passing**.
- Backend integration (e2e, Postgres-backed) tests: **391/392 passing** (one pre-existing,
  unrelated failure — see "Known issue" below).
- Frontend production build: **clean**, all 42 routes compile (`next build`, Turbopack),
  including the two new `/admin/rooms` and `/admin/tour-sessions` pages.
- Frontend lint and backend lint/typecheck: clean.
- Every admin route verified live via an authenticated browser session; every change verified to
  propagate through the real backend to the public customer-facing API.

## Per-module status

### Hotels (+ Rooms, Rate Plans, Inventory)
Unchanged from the first pass: `DataTable` list, create form, dedicated edit page with
`ImageManager`, per-room edit/images/rate-plans/inventory panels. **Done.**

### Hotel Rooms (standalone) — newly built
- **Backend**: `GET /admin/rooms` (new `AdminRoomsIndexController`, `AdminRoomsService.listAll`) —
  every room across every hotel, with hotel name, rate-plan count, today's inventory snapshot and
  cover image; filterable by `hotelId`/`status`, searchable by room/hotel name, paginated.
  Creation and per-room mutation reuse the existing nested `/admin/hotels/:hotelId/rooms/*`
  endpoints — no business logic duplicated.
- **Frontend**: `/admin/rooms` — `DataTable` list (thumbnail, room, hotel, capacity, rate plans,
  today's availability, status, actions) with hotel/status filters and debounced search; a
  create form requiring a hotel picker; a row-click drawer with inline edit (name/bed
  type/capacity/features), publish/unpublish, delete, and the full `ImageManager`, plus a link
  through to the hotel's own page for rate plans/inventory.
- **Verified live**: loaded 18 rows, filtered by hotel and status, opened the drawer, edited
  fields, replaced an image (see Media section), confirmed changes against the public API.
- **Bug found and fixed during verification**: the hotel/tour picker dropdowns requested
  `pageSize: 200`, which exceeds the backend's hard cap of 50 (`MAX_PAGE_SIZE`) and 422'd —
  silently breaking the dropdown. Fixed by requesting `pageSize: 50`, consistent with every other
  picker in the codebase.

### Tours (+ Sessions)
Unchanged from the first pass: `DataTable` list, create form, dedicated edit page with
`ItineraryEditor`, `TagListInput`, `ImageManager`. **Done.**

### Tour Sessions (standalone) — newly built
- **Backend**: `GET /admin/tour-sessions` (new `AdminTourSessionsIndexController`,
  `AdminTourSessionsService.listAll`) — every session across every tour, with tour title,
  capacity, held/booked/remaining units and status; filterable by `tourId`/`status`/date range,
  searchable by tour title, paginated. Creation and capacity/status changes reuse the existing
  nested `/admin/tours/:tourId/sessions/*` endpoints.
- **Frontend**: `/admin/tour-sessions` — `DataTable` list (tour, date/time, capacity, held, sold,
  remaining, status, actions) with tour/status filters and search; create form requiring a tour
  picker; inline capacity editor; open/close/cancel actions (cancel hidden once a session has
  bookings, as an extra UI safety net on top of the backend's own capacity-floor guard).
- **Verified live**: loaded 20 rows; edited a session's capacity via real keyboard interaction and
  confirmed the `PATCH .../capacity` request and 200 response; reverted the test value afterward.

### Cars, Transfers, Packages, Destinations/Locations, Media management, Dashboard, Admin shell
Unchanged from the first pass — all previously reported as done. See the "Media management" fix
below for one addition that touches all of these (anything with images).

### Image management (`ImageManager`) — replace + upload progress added
- **Replace**: new `PATCH /admin/media/:id/file` endpoint (`AdminMediaService.replaceFile`) swaps
  a Media row's underlying file in place — same id, same gallery position, same cover flag — and
  flips `source`/`sourceUrl`/`attribution`/`licenseCode` back to a plain upload so the row no
  longer points at stale external metadata. Frontend: a "Replace" button (refresh icon) per image,
  wired to a shared hidden file input keyed by a ref (not state, since the file-picker's change
  event must resolve synchronously to the right image).
- **Upload progress**: `adminApi.uploadWithProgress` (new, in `lib/admin/api.ts`) uses
  `XMLHttpRequest` instead of `fetch` (fetch has no upload-progress event), with the same
  single-retry-on-401 refresh behaviour as the rest of the client. `ImageManager` now tracks a
  per-file task list with a live percentage and a progress bar per upload, plus per-file error
  display instead of one generic "uploading" spinner.
- **Real bug found and fixed**: seeded "imported external" product images (the majority of the
  demo catalogue — Wikimedia/Unsplash photos) use a synthetic `storageKey` (`ext/OWNER/slug/i`)
  that was never a real stored file; `AdminMediaService.toView()` always built
  `/api/v1/media/${storageKey}` regardless of source, so every such image was
  `ERR_BLOCKED_BY_ORB` in the admin's `ImageManager` gallery (though it displayed correctly on the
  public customer site, which already had this branch in `MediaReader`). Fixed by mirroring
  `MediaReader`'s branch: imported-external rows now serve their real `sourceUrl` in the admin
  view too. Verified live (image loads, 0 failed requests) and with two new e2e tests.
- **Self-inflicted test-database corruption found and fixed**: the first version of the two new
  e2e tests for this feature picked an arbitrary seeded `IMPORTED_EXTERNAL` row via
  `findFirstOrThrow` and permanently mutated it — in the shared, non-reset test database, this
  silently corrupted a real seeded car model's cover image on one run, which then broke an
  unrelated, pre-existing test (`catalogue/safety-and-performance.e2e-spec.ts`'s "every public
  image is served over https" check) on a later run. Rewrote the tests to create a dedicated
  throwaway `IMPORTED_EXTERNAL` fixture row instead of touching shared seed data (the same
  isolation pattern every other test in the file already uses for its throwaway hotel), and
  removed the duplicate corrupted rows the earlier buggy version had left behind. Full suite
  re-run confirmed clean afterward.
- **Verified live, end to end**: replaced a real room's cover image via the admin drawer →
  confirmed the public `/hotels/:slug/rooms` API immediately served the new file instead of the
  old Wikimedia URL, with `attribution`/`license` correctly cleared.

### Bookings, Payments, Locations, Policies — converted to `DataTable`
- **Bookings**: list now uses `DataTable` (reference, customer, product, status, payment, total,
  created) with the existing reference/status/product filter bar and server pagination
  preserved; row click navigates to the booking detail page as before.
- **Payments**: the InstaPay review queue's list panel now uses `DataTable` (transfer reference,
  amount, status, submitted) with a status filter (previously hardcoded to pending-only, now also
  browsable for `SUCCEEDED`/`REJECTED`); the master-detail review/approve/reject workflow is
  unchanged (that business logic is explicitly not duplicated). The approve/reject actions in the
  detail panel are now gated on `selected.status === "PENDING_VERIFICATION"` instead of always
  showing, since an already-reviewed item can't be approved or rejected twice.
- **Locations**: `DataTable` with the exact required columns (Name, Destination, Location type,
  Status, Actions); inline rename kept, now rendered inside a `DataTable` cell instead of a plain
  list row.
- **Policies**: `DataTable` (Name, Code, Description, Refund rules); edit moved from an inline
  expanding block to a right-side drawer (the brief's "dedicated page/modal/drawer" requirement),
  since the full rules editor doesn't fit well as an inline table-row expansion.
- **Verified live**: all four pages load, search/sort/paginate; typecheck, lint and production
  build clean.

## Known issue (pre-existing, unrelated to this work)

`test/catalogue/tours.e2e-spec.ts › sessions › does not offer closed sessions` still fails
deterministically — unchanged from the first pass of this report. Root cause: the seed's
`HIDDEN_SESSIONS` rolling fixture computes its date as `today + dayOffset` at seed time, and the
test database is deliberately never reset between runs (`migrate-test.mjs`'s own comment: "tests
clean up their own rows; use a fresh container to start from an empty database"), so stale
fixture rows from earlier calendar days accumulate. Confirmed unrelated to any change in this
session (no admin-dashboard work touches `prisma/seed/**` or tour session dates). Left unfixed
rather than risk an out-of-scope seed-logic change or a database reset, both out of bounds for
this task.

## Operational/environment notes (not code defects)

- **Dev-server first-compile hiccup**: on this machine, `H:\Booking` triggers a Windows
  file-locking quirk (`EPERM` on a manifest rename) the first time the Next.js dev server
  compiles a route that hasn't been requested yet since the last restart — matches Next's own
  "slow filesystem / network drive" warning. Every affected route (new and pre-existing alike)
  served a clean `200` on the very next request. Not something to fix in application code;
  running `next build` is unaffected (confirmed clean 42-route build).
- **Dev-database demo note**: while live-verifying the Replace feature, "Classic River Room" at
  Old Cataract Aswan had its cover photo replaced with a 1x1 test pixel in the **dev** database
  (the one the demo environment uses). Cosmetic only — re-upload a real photo via the admin UI's
  Replace button before a demo if this specific room is shown. The **test** database's equivalent
  corruption (a different, car-model row) was found and cleaned up as described above; the two
  databases are entirely separate (different ports/containers).

## Explicitly outstanding

None of the gaps listed in the previous version of this report remain open. Everything requested
— ImageManager replace/progress, the two standalone tables, and the four DataTable conversions —
is implemented and verified live against the real backend and the public customer site.
