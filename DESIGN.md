# E-HADIR — System Design

E-HADIR is a digital attendance (check-in) system for FELCRA Berhad Kelantan.
Staff check in for a meeting/event by entering their staff ID on a kiosk-style
web page; the system looks them up, records attendance timestamped to
Asia/Kuala_Lumpur time, and shows a live attendance dashboard. Admins manage
events, staff, attendance records, and position ordering from a separate
admin panel.

This document describes how the pieces actually fit together today,
including the rough edges. It is meant to be read alongside `CLAUDE.md`
(quick orientation for AI coding agents) and `README.md` (setup steps).

## 1. Tech stack

- **Framework**: Next.js 14 (Pages Router), used almost entirely as a thin
  API-route host — there are no React pages.
- **Frontend**: hand-written static HTML/CSS/JS files in `public/`, served
  as-is by Next's static file serving. Tailwind is pulled in via the CDN
  build (`cdn.jsdelivr.net/npm/tailwindcss@2.2.19`), not the PostCSS plugin.
- **Database**: Neon (serverless Postgres), accessed via
  `@neondatabase/serverless`'s HTTP-based `neon()` client (no persistent
  connections, no interactive transactions — see §5).
- **Image hosting**: Cloudinary, for admin-uploaded logos/backgrounds.
- **Fonts/icons**: Google Fonts (Inter) and Font Awesome, both via CDN.

## 2. Rendering model

`next.config.js` rewrites `/` → `/index.html`, so the "app" is really a set
of static HTML files with embedded `<script>` blocks that call JSON API
routes under `pages/api/`. There is no client-side router, no bundler step
for the frontend, and no shared component layer between pages — each HTML
file duplicates its own theme CSS, modal markup, and helper JS.

```
Browser ──GET /──────────────► /public/index.html   (check-in kiosk)
Browser ──GET /kehadiran.html─► /public/kehadiran.html (live dashboard)
Browser ──GET /setup.html─────► /public/setup.html   (admin panel)
             │
             └── fetch('/api/...') ──► pages/api/**/*.js ──► lib/db.js ──► Neon
```

## 3. Pages

### `public/index.html` — Check-in kiosk (`/`)

The default landing page. Flow:

1. Fetch `/api/meeting-info` → populates title, date, location, logo, and
   the light/dark background images for the **currently active event**.
2. Staff types their ID → `POST /api/check-staff`.
   - `already_recorded` → staff already checked in for this event.
   - `success` → known staff, shows name/position for confirmation →
     `POST /api/attendance/record`.
   - `not_found` → shows a short registration form →
     `POST /api/staff/add` (creates the staff row **and** records
     attendance in one call).
3. Entering ID `0000` opens a password prompt. On success it navigates to
   `setup.html` (full page redirect, not a modal swap).

Theme (light/dark) is stored in `localStorage` and mirrored onto
`document.body` as a `dark-mode` class; it also seeds from
`prefers-color-scheme` on first load.

**Dead code**: everything in this file that would run *after* the admin
password check (a second copy of the settings modal, staff CRUD table,
`switchAdminTab`, etc.) is unreachable, because the password handler
`window.location.href`-redirects to `setup.html` before any of it can run.
It's a leftover from before the admin panel was split into its own page.
See §7.

### `public/setup.html` — Admin panel (reached via the `0000` gate)

A tabbed SPA-in-one-file:

| Tab | Purpose | Backing APIs |
|---|---|---|
| **Tetapan** | Create/edit events, upload logo & light/dark backgrounds, toggle form on/off, activate an event | `/api/events/{list,create,update,activate}`, `/api/upload/image` |
| **Data Staf** (PENGURUSAN STAF) | Staff CRUD, search/filter by unit/lokasi/status, bulk update/delete, live stats | `/api/get-staff`, `/api/add-staff`, `/api/update-staff`, `/api/delete-staff`, `/api/bulk-update-staff`, `/api/bulk-delete-staff` (logic in `public/staff-management.js`) |
| **Pengurusan Kehadiran** | View/edit/delete attendance records | `/api/attendance/{list,admin-record,delete}` |
| **Susunan Jawatan** | Reorder position ranking (controls sort order everywhere staff are listed) | `/api/positions/{list,sync,bulk-update}` |

Password is a hardcoded string literal (`"onearekeamall"`) checked entirely
client-side in `index.html`'s `validatePassword()` — see §7 for why this
isn't real access control.

### `public/kehadiran.html` — Live attendance dashboard

Read-only, meant to be projected/displayed during an event. Polls
`/api/admin-settings` (event branding) and `/api/attendance/list` +
`/api/get-staff` every 30s (`refreshData`, `setInterval(..., 30000)`),
merges staff × attendance client-side, and renders:

- A stats grid (Jumlah Jemputan / Hadir / Belum Hadir / Peratus Kehadiran).
  Clicking a card filters the list to that subset (`quickFilterAttendance`);
  clicking the same card again clears the filter. The filter persists
  across the 30s auto-refresh because `processData()` re-applies
  `filterData()` instead of re-rendering the raw dataset.
- A searchable, responsive list (desktop table + mobile cards) of invited
  staff, each showing Jawatan/Lokasi and a HADIR/BELUM badge.

Only staff who are either invited (`staff.status === 'JEMPUTAN'`) or marked
`WAKIL` on their attendance record are shown — see `processData()`.

## 4. Theming & branding

Both `index.html` and `kehadiran.html` implement the same pattern
independently (not shared code):

- `.text-primary` / `.text-secondary` / `.text-accent` are custom CSS
  classes, redefined under `body.dark-mode`. This is the **theme-correct**
  way to color text on this site, because `body.dark-mode` is toggled by
  the site's own JS (from `localStorage`, falling back to
  `prefers-color-scheme`).
- Tailwind's `dark:` utility classes (e.g. `dark:text-gray-400`) are a trap
  here — the Tailwind CDN build defaults to the **media** strategy, so
  `dark:` follows the OS/browser color-scheme preference, not this site's
  toggle. Mixing `dark:` classes with `.text-secondary` on the same element
  causes exactly the kind of low-contrast bug that was fixed on
  `kehadiran.html`'s Jawatan/Lokasi labels (Tailwind `dark:` disagreeing
  with `body.dark-mode`). Prefer `.text-primary`/`.text-secondary` for new
  UI on these pages; avoid `dark:` entirely unless you also delete the
  custom theme classes.
- Backgrounds (light/dark) and the logo are per-event, stored on the
  `events` row and served through Cloudinary → wrapped in a `serveproxy.com`
  redirect (see §7).

## 5. Data model (Neon Postgres)

All tables are created lazily by the `init*` functions in `lib/db.js`
(called from the relevant API routes, and all together via
`GET /api/db/init`) — there is no migration framework; schema changes are
plain `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD COLUMN IF NOT EXISTS`.

```
events                          staff
├─ id (PK, "evt_...")           ├─ id (PK, staff number)
├─ title, date, location        ├─ name, position, location, unit
├─ logo_url                     └─ status ('', 'JEMPUTAN', 'WAKIL')
├─ background_light_url               │
├─ background_dark_url                │ 1
├─ status ('on'|'off')                │
└─ is_active (bool)                    │ *
        │ 1                     invitations
        │                       ├─ staff_id (FK → staff)
        │ *                     └─ event_id (defaults to 'default')
attendance
├─ staff_id (FK → staff, CASCADE)
├─ event_id (FK → events)
├─ name, status ('HADIR'|'WAKIL')
├─ timestamp, acara
└─ created_at

position_ranking
├─ position_name (unique)
└─ ranking_order          -- drives sort order in staff lists & kehadiran.html

admin_settings   -- legacy, pre-multi-event. See §7.
```

- **Multi-event model**: `events.is_active` marks the single event currently
  shown on the public kiosk/dashboard. `setActiveEvent()` flips it
  exclusively (`UPDATE events SET is_active = false` then sets one true).
  Attendance rows are scoped by `event_id`, so switching the active event
  changes what `index.html`/`kehadiran.html` show without touching old
  attendance history.
- **No transactions**: the Neon HTTP driver used here is stateless per
  query (no `sql.begin()`), so multi-statement operations like
  `setActiveEvent` or `bulkUpdatePositionRankings` run as sequential
  awaited queries / `Promise.all`, not atomically. Acceptable at current
  scale (small admin-driven writes), but worth knowing before adding
  anything higher-throughput.
- **Staff status vs. attendance status** are two different fields with
  overlapping values: `staff.status` is set once (defaults to `WAKIL` on
  first attendance if empty, or `HADIR` if the staff ID was in
  `invitations`); `attendance.status` is recorded per check-in. Don't
  conflate them when reading the code.

## 6. API surface

Grouped by what's actually exercised by a live page today (checked by
grepping every `fetch('/api/...')` call in `public/*.html` and
`public/staff-management.js`).

### Live — public check-in flow (`index.html`)

| Route | Method | Notes |
|---|---|---|
| `/api/meeting-info` | GET | Active event's branding + form on/off status |
| `/api/check-staff` | POST | Looks up staff + duplicate-attendance check, scoped to the active event |
| `/api/attendance/record` | POST | Records attendance against the active event |
| `/api/staff/add` | POST | Self-registration path: creates staff + records attendance in one call (not event-scoped — always writes without an `event_id`) |

### Live — admin panel (`setup.html` + `staff-management.js`)

| Route | Method |
|---|---|
| `/api/events/list`, `/create`, `/update`, `/activate` | GET/POST |
| `/api/upload/image` | POST (Cloudinary) |
| `/api/get-staff`, `/add-staff`, `/update-staff`, `/delete-staff` | GET/POST |
| `/api/bulk-update-staff`, `/bulk-delete-staff` | POST |
| `/api/attendance/list`, `/admin-record`, `/delete` | GET/POST |
| `/api/positions/list`, `/sync`, `/bulk-update` | GET/POST |

### Live — dashboard (`kehadiran.html`)

| Route | Method |
|---|---|
| `/api/admin-settings` | GET — active event branding (a narrower cousin of `meeting-info`) |
| `/api/attendance/list` | GET |
| `/api/get-staff` | GET |

### Operational / one-off

| Route | Method | Purpose |
|---|---|---|
| `/api/db/init` | GET | Creates all tables (idempotent) — see `MIGRATION-GUIDE.md` |
| `/api/db/migrate` | POST | One-time Google Sheets → Neon import |
| `/api/verify-env.js` | GET | Dumps which env vars are set (masked) — diagnostic only |

### Orphaned / legacy (no frontend caller today — grepped, not called)

These exist in `pages/api/` but nothing in `public/` calls them. Kept for
now; safe candidates for deletion once confirmed unused in any external
integration:

- `/api/admin-settings.js`'s siblings `/api/save-settings.js` and
  `/api/settings/update.js` — three different single-event "settings"
  endpoints from before events existed. `settings/update` is only referenced
  from the **dead code** in `index.html` (§3); `save-settings` has no
  caller anywhere.
- `/api/positions/update.js` — superseded by `/api/positions/bulk-update.js`.
- `/api/attendance/update.js` — superseded by `/api/attendance/admin-record.js`.

## 7. Known technical debt

Recorded here so it isn't accidentally treated as intentional design on the
next pass:

1. **Admin password is not real access control.** `index.html`'s
   `validatePassword()` hardcodes the password as a JS string literal,
   checked entirely in the browser. `NEXT_PUBLIC_ADMIN_PASSWORD` is defined
   in `.env.local` and exposed to the client bundle via `next.config.js`,
   but the code doesn't actually read it — the literal is used instead. View
   Source or a breakpoint reveals the password either way. There is no
   server-side session/token; `setup.html` has no auth check of its own —
   reaching it directly by URL bypasses the prompt entirely.
2. **`serveproxy.com` URL wrapping.** `/api/upload/image.js` wraps every
   Cloudinary URL in `https://serveproxy.com/?url=<encoded>` before
   returning it, and this wrapped form is what gets stored in the database
   and rendered as `<img src>` everywhere. This is a third-party proxy this
   codebase doesn't control — worth confirming it's still intentional
   before depending on it further (e.g. it's a single point of failure for
   every image on every page, and a non-obvious detour for anyone tracing
   "why is the logo a serveproxy.com URL").
3. **Duplicate admin implementations.** `index.html` contains a full second
   copy of the settings/staff-CRUD admin UI that is unreachable dead code
   (§3). `setup.html`'s equivalent is the one actually used. The dead copy
   still gets parsed/loaded by every visitor and can drift out of sync
   silently (it already has diverged — e.g. its own `applyStaffFilters()`
   reads filter values directly from the DOM, while `staff-management.js`'s
   version — the live one — uses a `staffFilters` state object).
4. **Three overlapping "settings" endpoints** (§6) predate the events
   table and now all just proxy to `getActiveEvent`/`updateEvent`. Only
   `/api/admin-settings` (GET) is actually called by a live page.
5. **No CSS/JS sharing between pages.** `index.html`, `setup.html`, and
   `kehadiran.html` each define their own copy of `.glass-card`,
   `.text-secondary`, the theme-toggle script, etc. A fix applied to one
   (like the Tailwind `dark:` vs `body.dark-mode` mismatch in §4) does not
   automatically apply to the others — check all three when touching shared
   visual patterns.
6. **Stray root files** (`api_out.txt`, `api_out_utf8.txt`,
   `staff_response.json`) look like debug/response dumps from development
   and aren't referenced by any code path — candidates for deletion or
   `.gitignore`.

## 8. Environment variables

See `.env.example` / `README.md` for the current list. In short:
`DATABASE_URL` (Neon), `NEXT_PUBLIC_ADMIN_PASSWORD` (defined but effectively
unused — see §7.1), `CLOUDINARY_CLOUD_NAME`/`_API_KEY`/`_API_SECRET`, and
optionally `GOOGLE_PRIVATE_KEY`/`GOOGLE_CLIENT_EMAIL`/`GOOGLE_SHEET_ID` for
the one-time Sheets migration only.

## 9. Local development

```bash
npm install
npm run dev        # http://localhost:3000
curl http://localhost:3000/api/db/init   # first run only — creates tables
```

There's no test suite and no build step for the frontend — editing any file
under `public/` takes effect on the next browser refresh (Next.js serves
`public/` from disk on every request in `next dev`).
