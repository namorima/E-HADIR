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
3. **Meeting Info**: Client calls `/api/meeting-info` to load event details from Google Sheets
4. **Staff Check**: User enters ID → calls `/api/check-staff`
   - Returns staff info if found in `DATA STAF` sheet
   - Returns "already_recorded" if attendance already exists in `KEHADIRAN` sheet
   - Returns "not_found" if staff doesn't exist
5. **Registration**: For new staff → calls `/api/staff/add` to add to `DATA STAF` sheet
6. **Attendance Recording**: Calls `/api/attendance/record` to write to `KEHADIRAN` sheet

### Google Sheets Integration

The system uses **Service Account authentication** (not OAuth) with three main sheets:

- **DATA STAF**: Master staff list (columns: ID, Nama, Jawatan, Lokasi, [empty], Status)
- **DATA JEMPUTAN**: Invitation list (used to check if staff is invited)
- **KEHADIRAN**: Attendance records (columns: Timestamp, ID, Nama, Status)
- **FX**: Settings sheet (cells K1-K6: Title, Date, Location, Logo, FormStatus, BackgroundURL)

### API Route Architecture

All API routes are in `pages/api/`:

- `meeting-info.js`: GET - Fetches meeting settings from FX sheet (K1:K6)
- `check-staff.js`: POST - Checks if staff ID exists and if attendance already recorded
- `attendance/record.js`: POST - Records attendance to KEHADIRAN sheet
- `staff/add.js`: POST - Adds new staff to DATA STAF sheet
- `settings/update.js`: POST - Updates FX sheet settings (admin only)

**Important**: All API routes use Service Account credentials from environment variables. The `googleapis` library handles authentication with `GoogleAuth` class.

### Configuration System

The app uses a dual-configuration approach:

1. **setup.json** (public/setup.json): Client-side config for logo and background images (loaded by browser)
2. **Google Sheets FX sheet**: Server-side config for meeting info, form status, and dynamic settings

The `meeting-info.js` API route intentionally ignores the logo URL from FX sheet and always returns default values from hardcoded constants (lines 42-47) to maintain consistency.

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
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your-spreadsheet-id
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password
```

**Critical**: `GOOGLE_PRIVATE_KEY` must include literal `\n` characters (not actual newlines). The API routes replace `\\n` with actual newlines (`.replace(/\\n/g, '\n')`).

## Deployment Considerations

### Next.js Configuration
- Uses rewrites to serve static HTML from root (`/` → `/index.html`)
- CORS headers configured for all `/api/*` routes
- Webpack configured to disable `fs` module for client-side bundles

### Google Sheets Permissions
The Service Account email must have **Editor** permissions on the target spreadsheet.

### Vercel/Netlify
Environment variables must be configured in the hosting platform's dashboard. The app is optimized for serverless deployment.

## Key Implementation Details

### Staff Status Logic
- Default status is "WAKIL" (representative/proxy attendance)
- Status becomes "HADIR" (present) if staff ID exists in `DATA JEMPUTAN` sheet
- Status column (F) in `DATA STAF` is auto-populated on first attendance if empty

### Duplicate Prevention
The `check-staff.js` route searches `KEHADIRAN` sheet backwards (from last row) to find most recent attendance record for a given staff ID, preventing duplicate entries.

### Form Status Control
The FX sheet cell K5 controls form availability:
- "on" = Form active
- "off" = Form disabled (shows "BORANG DITUTUP")
- Checked client-side and server-side

### Custom Backgrounds
- Images stored in `public/` folder or external URLs
- Applied via dynamic CSS injection with blur effect
- Falls back to default animated golf field gradient if not configured
