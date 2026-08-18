# E-HADIR — Digital Attendance System (FELCRA Berhad Kelantan)

Digital check-in kiosk for meetings/events. Staff enter their ID to record
attendance; admins manage events, staff, attendance records, and position
ordering from a password-gated admin panel. A separate live dashboard page
can be projected during the event.

For how the system is actually built (pages, data model, API surface, and
known rough edges), see **[DESIGN.md](./DESIGN.md)**. For AI-agent-oriented
quick orientation, see **[CLAUDE.md](./CLAUDE.md)**.

## Features

- Real-time attendance check-in, scoped per event
- Multi-event support — create events, switch which one is "active" without
  losing history
- New-staff self-registration at check-in time
- Admin panel: event settings, staff CRUD (search/filter/bulk actions),
  attendance record management, position ranking
- Logo & background image upload (Cloudinary), per event, per light/dark
  theme
- Light/dark theme with custom background images
- Responsive glassmorphism UI (desktop table + mobile card views)

## Prerequisites

- Node.js 18+
- npm 9+
- A [Neon](https://neon.tech) Postgres database
- A [Cloudinary](https://cloudinary.com) account (for image uploads)

## Installation

```bash
git clone <your-repo-url>
cd e-hadir
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Neon PostgreSQL connection string (required)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Admin panel password (see DESIGN.md §7 — not currently enforced server-side)
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password

# Cloudinary credentials for image uploads (required)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional — only needed for a one-time Google Sheets import (see MIGRATION-GUIDE.md)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your-spreadsheet-id
```

### Initialize the database

```bash
npm run dev
curl http://localhost:3000/api/db/init
```

This creates all tables (`events`, `staff`, `invitations`, `attendance`,
`position_ranking`, plus the legacy `admin_settings`) if they don't exist
yet — safe to run more than once.

Open http://localhost:3000

## Pages

| URL | Purpose |
|---|---|
| `/` (`public/index.html`) | Public check-in kiosk |
| `/kehadiran.html` | Live, read-only attendance dashboard (for projecting during the event) |
| `/setup.html` | Admin panel — reached by entering ID `0000` on the kiosk and the admin password |

## Commands

```bash
npm run dev     # Start development server on http://localhost:3000
npm run build   # Build production application
npm start       # Start production server
npm run lint    # Run ESLint
```

## File structure

```
e-hadir/
├── public/
│   ├── index.html            # Check-in kiosk (/)
│   ├── kehadiran.html        # Live attendance dashboard
│   ├── setup.html            # Admin panel
│   ├── staff-management.js   # Staff CRUD logic used by setup.html
│   └── setup.json            # Static logo/background config (legacy)
├── pages/api/
│   ├── meeting-info.js, check-staff.js, attendance/record.js, staff/add.js
│   ├── events/                 # list, create, update, activate
│   ├── attendance/             # list, admin-record, delete, record
│   ├── positions/               # list, sync, bulk-update
│   ├── get-staff.js, add-staff.js, update-staff.js, delete-staff.js
│   ├── bulk-update-staff.js, bulk-delete-staff.js
│   ├── upload/image.js         # Cloudinary upload
│   └── db/init.js, db/migrate.js
├── lib/db.js                  # All Neon Postgres queries live here
├── DESIGN.md                  # Full architecture + known issues
├── CLAUDE.md                  # Quick orientation for AI coding agents
├── MIGRATION-GUIDE.md         # Google Sheets → Neon migration steps
├── CLOUDINARY-SETUP.md        # Cloudinary setup + upload flow details
├── .env.local                 # Environment variables (gitignored)
└── package.json
```

## Deployment

### Vercel (recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add the environment variables above
4. Deploy, then run `curl https://your-site.vercel.app/api/db/init` once

### Netlify

1. Push code to GitHub
2. New site from Git — build command `npm run build`, publish directory `.next`
3. Add environment variables
4. Deploy, then run the same `db/init` call against the deployed URL

## Data model

See [DESIGN.md §5](./DESIGN.md#5-data-model-neon-postgres) for the full
schema and how events/staff/attendance relate.

## Troubleshooting

### "DATABASE_URL environment variable is required"

Set `DATABASE_URL` in `.env.local` to a valid Neon connection string
(Neon Console → Connection Details).

### Image upload fails / logo or background doesn't show up

Check Cloudinary credentials in `.env.local`, and see
[CLOUDINARY-SETUP.md](./CLOUDINARY-SETUP.md#troubleshooting).

### Migrating existing Google Sheets data

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md).

## License

ISC License — FELCRA Berhad Kelantan
