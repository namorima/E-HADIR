# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-HADIR is a digital attendance system built with Next.js that integrates with Google Sheets via Service Account authentication. The application allows staff to check in for meetings/events, with support for both registered staff and new staff registration. It features a glassmorphism UI with light/dark theme support and custom background images.

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
```

## Architecture

### Application Flow

1. **Client Entry**: User loads `public/index.html` (single-page application)
2. **Configuration Loading**: Client fetches `/setup.json` for logo and background images
3. **Meeting Info**: Client calls `/api/meeting-info` to load event details from Neon DB
4. **Staff Check**: User enters ID → calls `/api/check-staff`
   - Returns staff info if found in `staff` table
   - Returns "already_recorded" if attendance already exists in `attendance` table
   - Returns "not_found" if staff doesn't exist
5. **Registration**: For new staff → calls `/api/staff/add` to add to `staff` table
6. **Attendance Recording**: Calls `/api/attendance/record` to write to `attendance` table

### Database Integration

The system uses **Neon PostgreSQL** with four main tables:

- **staff**: Master staff list (id, name, position, location, unit, status)
- **invitations**: Invitation list (staff_id, event_id)
- **attendance**: Attendance records (staff_id, name, status, timestamp)
- **admin_settings**: Settings (title, date, location, logo_url, status, background URLs)

### API Route Architecture

All API routes are in `pages/api/`:

- `meeting-info.js`: GET - Fetches meeting settings from `admin_settings` table
- `check-staff.js`: POST - Checks if staff ID exists and if attendance already recorded
- `attendance/record.js`: POST - Records attendance to `attendance` table
- `staff/add.js`: POST - Adds new staff to `staff` table and records attendance
- `settings/update.js`: POST - Updates `admin_settings` table (admin only)
- `get-staff.js`: GET - Fetches all staff from database
- `add-staff.js`: POST - Adds new staff to database
- `update-staff.js`: POST - Updates staff information
- `delete-staff.js`: POST - Deletes staff (CASCADE deletes related records)
- `db/init.js`: GET - Initialize all database tables
- `db/migrate.js`: POST - One-time migration from Google Sheets to Neon DB

**Important**: All API routes use Neon PostgreSQL via `@neondatabase/serverless` package. Database functions are in `lib/db.js`.

### Configuration System

The app uses a dual-configuration approach:

1. **setup.json** (public/setup.json): Client-side config for logo and background images (loaded by browser)
2. **Neon Database admin_settings table**: Server-side config for meeting info, form status, and dynamic settings

The `meeting-info.js` API route fetches settings from the database and returns the latest configuration.

### Date/Time Handling

- **Timezone**: Asia/Kuala_Lumpur (UTC+8)
- **Format**: `dd/MM/yyyy hh:mm:ss a` (e.g., "21/11/2025 01:17:13 PM")
- **Implementation**: Custom `Utilities.formatDate()` in `attendance/record.js` uses `Intl.DateTimeFormat`
- **Parsing**: Custom logic in `check-staff.js` (lines 65-79) parses Malaysian date format

### Theme System

- Supports light/dark modes with localStorage persistence
- Checks system preference `prefers-color-scheme: dark` as fallback
- Theme applies to both glassmorphism effects and background images
- Background URLs are managed separately for light (`backgroundLight`) and dark (`backgroundDark`) modes

### Admin Access

- Triggered by entering ID "0000" in the staff ID field
- Password modal appears (hardcoded password: "onearekeamall")
- Admin can modify settings via settings modal that updates FX sheet

## Environment Variables

Required in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Critical**: `DATABASE_URL` must be a valid Neon PostgreSQL connection string. Get this from Neon Console → Connection Details.

**Optional** (for migration only):

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
3. Visit `/api/db/init` to create tables
4. (Optional) Visit `/api/db/migrate` to import data from Google Sheets

### Vercel/Netlify

Environment variables must be configured in the hosting platform's dashboard. The app is optimized for serverless deployment with Neon's serverless driver.

## Key Implementation Details

### Staff Status Logic

- Default status is "WAKIL" (representative/proxy attendance)
- Status becomes "HADIR" (present) if staff ID exists in `invitations` table
- Status column in `staff` table is auto-populated on first attendance if empty

### Duplicate Prevention

The `check-staff.js` route queries `attendance` table (ORDER BY created_at DESC) to find most recent attendance record for a given staff ID, preventing duplicate entries.

### Database Performance

- Indexes on `staff_id`, `timestamp`, and `created_at` for fast queries
- Foreign key constraints ensure data integrity
- CASCADE delete removes related records automatically

### Form Status Control

The `admin_settings.status` column controls form availability:

- "on" = Form active
- "off" = Form disabled (shows "BORANG DITUTUP")
- Checked client-side and server-side

### Custom Backgrounds

- Images stored in `public/` folder or external URLs
- Applied via dynamic CSS injection with blur effect
- Falls back to default animated golf field gradient if not configured
