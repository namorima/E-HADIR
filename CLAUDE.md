# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For the full architecture write-up (data model, API surface, theming
system, and a list of known technical debt), see **[DESIGN.md](./DESIGN.md)**
— this file is a quick-orientation summary, DESIGN.md is the source of truth.

## Project Overview

E-HADIR is a digital attendance system for FELCRA Berhad Kelantan, built
with Next.js and Neon (serverless Postgres). Staff check in for a
meeting/event by entering their staff ID on a kiosk page; the system looks
them up (or registers them on the spot), records attendance timestamped to
Asia/Kuala_Lumpur time, and shows a live attendance dashboard. Multiple
events can exist; exactly one is "active" at a time and drives what the
public pages show. It features a glassmorphism UI with light/dark theme
support and per-event custom background images.

**Important**: this is not a single-page app. There are three independent
static HTML files in `public/`, each with its own duplicated CSS/JS (no
shared frontend code, no bundler):

- `public/index.html` (served at `/`) — the check-in kiosk.
- `public/setup.html` — the admin panel (events, staff, attendance,
  position ranking). Reached by entering ID `0000` on the kiosk.
- `public/kehadiran.html` — a read-only live attendance dashboard meant to
  be projected during the event; polls every 30s.

## Commands

### Development

```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build production application
npm start            # Start production server
npm run lint         # Run ESLint for code quality
```

### Installation

```bash
npm install          # Install all dependencies
curl http://localhost:3000/api/db/init   # First run only: creates all tables
```

## Architecture

### Application Flow (check-in kiosk, `public/index.html`)

1. **Client Entry**: user loads `public/index.html` at `/` (via a
   `next.config.js` rewrite).
2. **Meeting Info**: client calls `GET /api/meeting-info` to load the
   **active event**'s title/date/location/logo/backgrounds/form-status.
3. **Staff Check**: user enters ID → `POST /api/check-staff`
   - `already_recorded` if attendance already exists for this staff in the
     active event
   - `success` with staff info if found in `staff` table
   - `not_found` if staff doesn't exist
4. **Registration**: for new staff → `POST /api/staff/add` (creates the
   `staff` row **and** records attendance in one call)
5. **Attendance Recording**: `POST /api/attendance/record` writes to
   `attendance`, scoped to the active event's `id`
6. Entering ID `0000` + the admin password full-page-redirects to
   `public/setup.html`. Everything else in `index.html` that would run
   after that point (a second, unreachable copy of the settings/staff-CRUD
   admin UI) is dead code — see DESIGN.md §3/§7.

### Database Integration

**Neon PostgreSQL**, all queries centralized in `lib/db.js`. Tables (see
DESIGN.md §5 for the full ER-style breakdown):

- **events**: one row per meeting/event (title, date, location, logo,
  light/dark backgrounds, `status` on/off, `is_active`). Exactly one row
  has `is_active = true` at a time — that's what the public pages show.
- **staff**: master staff list (id, name, position, location, unit, status)
- **invitations**: which staff are invited to which event
- **attendance**: attendance records, scoped by `event_id`
- **position_ranking**: drives sort order for staff lists everywhere
- **admin_settings**: legacy, single-event predecessor of `events` — still
  created by `initDatabase()` but no longer the source of truth

### API Route Architecture

All routes are in `pages/api/`, all backed by `lib/db.js`. Grouped by what
actually has a live caller today (verified by grepping every
`fetch('/api/...')` in `public/`):

**Check-in kiosk** (`index.html`): `meeting-info.js` (GET),
`check-staff.js` (POST), `attendance/record.js` (POST), `staff/add.js`
(POST — registers + records attendance together).

**Admin panel** (`setup.html` + `staff-management.js`):
`events/{list,create,update,activate}.js`, `upload/image.js` (Cloudinary),
`get-staff.js`, `add-staff.js`, `update-staff.js`, `delete-staff.js`,
`bulk-update-staff.js`, `bulk-delete-staff.js`,
`attendance/{list,admin-record,delete}.js`,
`positions/{list,sync,bulk-update}.js`.

**Dashboard** (`kehadiran.html`): `admin-settings.js` (GET), 
`attendance/list.js`, `get-staff.js`.

**Operational**: `db/init.js` (GET, creates all tables — idempotent),
`db/migrate.js` (POST, one-time Google Sheets import), `verify-env.js` (GET
diagnostic).

**Legacy / orphaned** (exist on disk, no frontend caller — don't extend
these, extend the `events/*` equivalents instead):
`admin-settings.js`'s siblings `save-settings.js` and `settings/update.js`,
`positions/update.js` (superseded by `positions/bulk-update.js`),
`attendance/update.js` (superseded by `attendance/admin-record.js`).

### Configuration System

Event branding (title/date/location/logo/backgrounds/status) lives on the
**active row in the `events` table** — fetched via `/api/meeting-info`
(kiosk) or `/api/admin-settings` (dashboard). `public/setup.json` is a
separate, mostly-legacy static config for a default logo/background and is
not the primary config path.

### Date/Time Handling

- **Timezone**: Asia/Kuala_Lumpur (UTC+8)
- **Format**: `dd/MM/yyyy hh:mm:ss a` (e.g., "21/11/2025 01:17:13 PM")
- **Implementation**: `Utilities.formatDate()` in `attendance/record.js`
  uses `Intl.DateTimeFormat`
- **Parsing**: custom logic in `check-staff.js` parses the Malaysian date
  format for display in the "already recorded" message

### Theme System

- Light/dark mode via a `dark-mode` class on `<body>`, persisted in
  `localStorage`, falling back to `prefers-color-scheme` on first load.
- `.text-primary` / `.text-secondary` / `.text-accent` are the
  theme-correct custom classes (redefined under `body.dark-mode`).
  **Avoid Tailwind's `dark:` utilities on these pages** — the Tailwind CDN
  build uses the *media* strategy, so `dark:` follows the OS/browser
  preference instead of this site's own toggle, which causes exactly the
  low-contrast bugs seen before (see DESIGN.md §4).
- Each of the three HTML pages implements this independently — a fix in
  one file does not propagate to the others.
- Background images are per-event and per-theme
  (`backgroundLight`/`backgroundDark` on the active event).

### Admin Access

- Triggered by entering ID `0000` in the staff ID field on the kiosk.
- Password modal appears; on match, **redirects (full page navigation) to
  `setup.html`** — it is not a modal overlay on the same page.
- The password check is entirely client-side, hardcoded as a string
  literal in `index.html` (`validatePassword()`), and `setup.html` itself
  has no auth check — visiting it directly by URL bypasses the prompt.
  `NEXT_PUBLIC_ADMIN_PASSWORD` is defined in `.env.local` and exposed to
  the client bundle but isn't actually read by the check. This is not real
  access control — see DESIGN.md §7.1 before relying on it for anything
  sensitive.

## Environment Variables

Required in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Critical**: `DATABASE_URL` must be a valid Neon PostgreSQL connection string.

**Optional** (for one-time Google Sheets migration only):

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your-spreadsheet-id
```

## Deployment Considerations

### Next.js Configuration

- Uses rewrites to serve static HTML from root (`/` → `/index.html`)
- CORS headers configured for all `/api/*` routes
- Webpack configured to disable `fs` module for client-side bundles

### Database Setup

1. Create Neon PostgreSQL database
2. Set `DATABASE_URL` in environment variables
3. Visit `/api/db/init` to create all tables (idempotent)
4. (Optional) Visit `/api/db/migrate` to import data from Google Sheets

### Vercel/Netlify

Environment variables must be configured in the hosting platform's dashboard.

## Key Implementation Details

### Staff Status Logic

- Default `staff.status` is empty; becomes `WAKIL` on first attendance if
  still empty, or `HADIR` if the staff ID was in the `invitations` table
  for that event.
- `attendance.status` (recorded per check-in: `HADIR`/`WAKIL`) is a
  separate field from `staff.status` — don't conflate them.

### Duplicate Prevention

`check-staff.js` queries `attendance` (scoped to the active event's
`event_id`, most recent by `created_at`) to detect an existing record for
a staff ID before allowing another check-in.

### Multi-Event Model

Only one `events` row has `is_active = true` at a time
(`setActiveEvent()` in `lib/db.js` flips it exclusively). Switching the
active event changes what the kiosk and dashboard show without deleting
older events' attendance history — each `attendance` row keeps its own
`event_id`.

### Form Status Control

The active event's `status` column controls form availability:

- `"on"` = form active
- `"off"` = form disabled (shows "BORANG DITUTUP")

### Custom Backgrounds

- Uploaded via `setup.html` → `/api/upload/image` → Cloudinary → wrapped in
  a `serveproxy.com` redirect before being stored and rendered as
  `<img src>` (see DESIGN.md §7.2 for why, and the risk of depending on a
  third-party proxy this codebase doesn't control).
- Falls back to a default animated gradient background if not configured.

## When making UI changes

- Check whether the same visual pattern exists in more than one of
  `index.html` / `setup.html` / `kehadiran.html` before considering a fix
  "done" — there is no shared CSS/JS between them.
- Prefer `.text-primary`/`.text-secondary` over Tailwind `dark:` classes on
  these pages (see Theme System above).
- Confirm you're editing the *live* code path — `index.html` contains a
  large unreachable duplicate of the admin UI (see Application Flow above
  and DESIGN.md §3/§7.3).
