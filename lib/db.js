// lib/db.js
// Database connection helper for Neon PostgreSQL

import { neon } from "@neondatabase/serverless";

// Initialize Neon client
export function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set in environment variables");
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(databaseUrl);
  return sql;
}

// Create admin_settings table if not exists
export async function initDatabase() {
  const sql = getDbClient();

  await sql`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL DEFAULT 'LAPORAN KEHADIRAN',
      date VARCHAR(50),
      location TEXT DEFAULT 'ARAS 2, BILIK MESYUARAT PEJABAT PENGARAH NEGERI',
      logo_url TEXT,
      status VARCHAR(10) DEFAULT 'on',
      background_light_url TEXT,
      background_dark_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Check if there's any data, if not insert default
  const result = await sql`SELECT COUNT(*) as count FROM admin_settings`;

  if (result[0].count === "0") {
    await sql`
      INSERT INTO admin_settings (
        title,
        date,
        location,
        logo_url,
        status,
        background_light_url,
        background_dark_url
      ) VALUES (
        'LAPORAN KEHADIRAN',
        '',
        'ARAS 2, BILIK MESYUARAT PEJABAT PENGARAH NEGERI',
        'https://serveproxy.com/?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fjohnadik%2Fkehadiran2%40main%2Flogo3.png',
        'on',
        'https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F1763628916sm154%3Falt%3Dmedia%26token%3Da410e76c-3a5f-4c05-b7f1-d78332b8aa24',
        'https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F17636288930klr%3Falt%3Dmedia%26token%3D9e98b210-518b-4348-8aa8-76c937cba161'
      )
    `;
  }

  return true;
}

// Get current admin settings
export async function getAdminSettings() {
  const sql = getDbClient();

  const result = await sql`
    SELECT * FROM admin_settings ORDER BY id DESC LIMIT 1
  `;

  if (result.length === 0) {
    // Return defaults if no settings found
    return {
      title: "LAPORAN KEHADIRAN",
      date: "",
      location: "ARAS 2, BILIK MESYUARAT PEJABAT PENGARAH NEGERI",
      logo_url:
        "https://serveproxy.com/?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fjohnadik%2Fkehadiran2%40main%2Flogo3.png",
      status: "on",
      background_light_url:
        "https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F1763628916sm154%3Falt%3Dmedia%26token%3Da410e76c-3a5f-4c05-b7f1-d78332b8aa24",
      background_dark_url:
        "https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F17636288930klr%3Falt%3Dmedia%26token%3D9e98b210-518b-4348-8aa8-76c937cba161",
    };
  }

  return result[0];
}

// Update admin settings
export async function updateAdminSettings(settings) {
  const sql = getDbClient();

  // Get current settings ID
  const current =
    await sql`SELECT id FROM admin_settings ORDER BY id DESC LIMIT 1`;

  if (current.length === 0) {
    // Insert new settings
    await sql`
      INSERT INTO admin_settings (
        title,
        date,
        location,
        logo_url,
        status,
        background_light_url,
        background_dark_url,
        updated_at
      ) VALUES (
        ${settings.title || ""},
        ${settings.date || ""},
        ${settings.location || ""},
        ${settings.logo || ""},
        ${settings.status || "on"},
        ${settings.backgroundLight || ""},
        ${settings.backgroundDark || ""},
        CURRENT_TIMESTAMP
      )
    `;
  } else {
    // Update existing settings
    await sql`
      UPDATE admin_settings
      SET
        title = ${settings.title || ""},
        date = ${settings.date || ""},
        location = ${settings.location || ""},
        logo_url = ${settings.logo || ""},
        status = ${settings.status || "on"},
        background_light_url = ${settings.backgroundLight || ""},
        background_dark_url = ${settings.backgroundDark || ""},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${current[0].id}
    `;
  }

  return true;
}

// ============================================
// EVENTS FUNCTIONS
// ============================================

function generateEventId() {
  return `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Create events table, add event_id to attendance, and migrate the
// existing single admin_settings row into the first event on first run.
export async function initEventsTable() {
  const sql = getDbClient();

  // Ensure admin_settings exists (used as the migration seed below)
  await initDatabase();

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(40) PRIMARY KEY,
      title VARCHAR(255) NOT NULL DEFAULT 'LAPORAN KEHADIRAN',
      date VARCHAR(50),
      location TEXT,
      logo_url TEXT,
      status VARCHAR(10) DEFAULT 'on',
      background_light_url TEXT,
      background_dark_url TEXT,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active)`;

  await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS event_id VARCHAR(40) REFERENCES events(id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id)`;

  const countResult = await sql`SELECT COUNT(*) as count FROM events`;
  if (countResult[0].count === "0") {
    const existing =
      await sql`SELECT * FROM admin_settings ORDER BY id DESC LIMIT 1`;
    const s = existing[0] || {};
    const newId = generateEventId();

    await sql`
      INSERT INTO events (
        id, title, date, location, logo_url, status,
        background_light_url, background_dark_url, is_active
      ) VALUES (
        ${newId},
        ${s.title || "LAPORAN KEHADIRAN"},
        ${s.date || ""},
        ${s.location || ""},
        ${s.logo_url || ""},
        ${s.status || "on"},
        ${s.background_light_url || ""},
        ${s.background_dark_url || ""},
        true
      )
    `;

    // Link all pre-existing attendance rows to this migrated event
    await sql`UPDATE attendance SET event_id = ${newId} WHERE event_id IS NULL`;
  }

  return true;
}

// Get all events (newest first) with attendance counts
export async function getAllEvents() {
  const sql = getDbClient();

  return await sql`
    SELECT
      e.*,
      COUNT(a.id)::int as attendance_count
    FROM events e
    LEFT JOIN attendance a ON a.event_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;
}

// Get the currently active event
export async function getActiveEvent() {
  const sql = getDbClient();

  const result =
    await sql`SELECT * FROM events WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;

  return result.length > 0 ? result[0] : null;
}

// Get a single event by id
export async function getEventById(id) {
  const sql = getDbClient();

  const result = await sql`SELECT * FROM events WHERE id = ${id} LIMIT 1`;

  return result.length > 0 ? result[0] : null;
}

// Create a new event and make it the active one
export async function createEvent(data) {
  const sql = getDbClient();
  const id = generateEventId();

  await sql`UPDATE events SET is_active = false`;

  await sql`
    INSERT INTO events (
      id, title, date, location, logo_url, status,
      background_light_url, background_dark_url, is_active
    ) VALUES (
      ${id},
      ${data.title || ""},
      ${data.date || ""},
      ${data.location || ""},
      ${data.logo || ""},
      ${data.status || "on"},
      ${data.backgroundLight || ""},
      ${data.backgroundDark || ""},
      true
    )
  `;

  return id;
}

// Update an existing event's details (does not change which event is active)
export async function updateEvent(id, data) {
  const sql = getDbClient();

  await sql`
    UPDATE events
    SET
      title = ${data.title || ""},
      date = ${data.date || ""},
      location = ${data.location || ""},
      logo_url = ${data.logo || ""},
      status = ${data.status || "on"},
      background_light_url = ${data.backgroundLight || ""},
      background_dark_url = ${data.backgroundDark || ""},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;

  return true;
}

// Make an existing event the active one ("Jadikan Aktif")
export async function setActiveEvent(id) {
  const sql = getDbClient();

  await sql`UPDATE events SET is_active = false`;
  await sql`UPDATE events SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

  return true;
}

// ============================================
// STAFF, INVITATIONS & ATTENDANCE FUNCTIONS
// ============================================

// Initialize staff-related tables
export async function initStaffTables() {
  const sql = getDbClient();

  // Create staff table
  await sql`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255),
      location VARCHAR(255),
      unit VARCHAR(255),
      status VARCHAR(20) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create invitations table
  await sql`
    CREATE TABLE IF NOT EXISTS invitations (
      id SERIAL PRIMARY KEY,
      staff_id VARCHAR(50) NOT NULL,
      event_id VARCHAR(100) DEFAULT 'default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    )
  `;

  // Create attendance table
  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      staff_id VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL,
      acara TEXT DEFAULT '',
      timestamp TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    )
  `;

  // Create position_ranking table
  await sql`
    CREATE TABLE IF NOT EXISTS position_ranking (
      id SERIAL PRIMARY KEY,
      position_name VARCHAR(255) UNIQUE NOT NULL,
      ranking_order INTEGER DEFAULT 9999,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_invitations_staff_id ON invitations(staff_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_invitations_event_id ON invitations(event_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance(staff_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at DESC)`;

  return true;
}

// Get all staff
export async function getAllStaff() {
  const sql = getDbClient();

  const result = await sql`
    SELECT 
      s.id, s.name, s.position, s.location, s.unit, s.status, s.created_at, s.updated_at,
      COALESCE(pr.ranking_order, 9999) as ranking_order
    FROM staff s
    LEFT JOIN position_ranking pr ON s.position = pr.position_name
    ORDER BY 
      COALESCE(pr.ranking_order, 9999) ASC,
      s.name ASC
  `;

  return result;
}

// Get staff by ID
export async function getStaffById(staffId) {
  const sql = getDbClient();

  const result = await sql`
    SELECT id, name, position, location, unit, status
    FROM staff
    WHERE id = ${staffId}
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}

// Add new staff
export async function addStaff(data) {
  const sql = getDbClient();

  await sql`
    INSERT INTO staff (id, name, position, location, unit, status)
    VALUES (
      ${data.id},
      ${data.name},
      ${data.position || ""},
      ${data.location || ""},
      ${data.unit || ""},
      ${data.status || ""}
    )
  `;

  return true;
}

// Update staff
export async function updateStaff(staffId, data) {
  const sql = getDbClient();

  await sql`
    UPDATE staff
    SET
      name = ${data.name},
      position = ${data.position || ""},
      location = ${data.location || ""},
      unit = ${data.unit || ""},
      status = ${data.status || ""},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${staffId}
  `;

  return true;
}

// Delete staff
export async function deleteStaff(staffId) {
  const sql = getDbClient();

  // CASCADE will automatically delete related invitations and attendance
  await sql`
    DELETE FROM staff
    WHERE id = ${staffId}
  `;

  return true;
}

// Update staff status only
export async function updateStaffStatus(staffId, status) {
  const sql = getDbClient();

  await sql`
    UPDATE staff
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${staffId}
  `;

  return true;
}

// Bulk update staff status for multiple IDs
export async function bulkUpdateStaffStatus(ids, status) {
  const sql = getDbClient();

  if (!ids || ids.length === 0) return true;

  await sql`
    UPDATE staff
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY(${ids})
  `;

  return true;
}

// Bulk delete staff for multiple IDs
export async function bulkDeleteStaff(ids) {
  const sql = getDbClient();

  if (!ids || ids.length === 0) return true;

  await sql`
    DELETE FROM staff
    WHERE id = ANY(${ids})
  `;

  return true;
}

// Check if staff is in invitation list
export async function checkInvitation(staffId, eventId = "default") {
  const sql = getDbClient();

  const result = await sql`
    SELECT id FROM invitations
    WHERE staff_id = ${staffId} AND event_id = ${eventId}
    LIMIT 1
  `;

  return result.length > 0;
}

// Add staff to invitation list
export async function addInvitation(
  staff_id,
  event_id = "default",
  acara = "",
) {
  const sql = getDbClient();

  await sql`
    INSERT INTO invitations (staff_id, event_id, acara)
    VALUES (${staff_id}, ${event_id}, ${acara})
  `;

  return true;
}

// Get last attendance record for a staff, scoped to a specific event
export async function getLastAttendance(staffId, eventId) {
  const sql = getDbClient();

  const result = await sql`
    SELECT id, staff_id, name, status, timestamp, created_at
    FROM attendance
    WHERE staff_id = ${staffId} AND event_id = ${eventId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}

// Record attendance against a specific event
export async function recordAttendance(data) {
  const sql = getDbClient();

  await sql`
    INSERT INTO attendance (staff_id, name, status, timestamp, acara, event_id)
    VALUES (
      ${data.staffId},
      ${data.name},
      ${data.status},
      ${data.timestamp},
      ${data.acara || ""},
      ${data.eventId}
    )
  `;

  return true;
}

// Get all attendance records with staff details, scoped to a specific event
export async function getAllAttendance(eventId) {
  const sql = getDbClient();

  const result = eventId
    ? await sql`
        SELECT
          a.id,
          a.staff_id,
          a.name,
          a.status,
          a.timestamp,
          a.acara,
          a.event_id,
          a.created_at,
          s.position,
          s.location
        FROM attendance a
        LEFT JOIN staff s ON a.staff_id = s.id
        WHERE a.event_id = ${eventId}
        ORDER BY a.created_at DESC
      `
    : await sql`
        SELECT
          a.id,
          a.staff_id,
          a.name,
          a.status,
          a.timestamp,
          a.acara,
          a.event_id,
          a.created_at,
          s.position,
          s.location
        FROM attendance a
        LEFT JOIN staff s ON a.staff_id = s.id
        ORDER BY a.created_at DESC
      `;

  return result;
}

// Update attendance record
export async function updateAttendance(id, data) {
  const sql = getDbClient();

  await sql`
    UPDATE attendance
    SET 
      name = ${data.name},
      status = ${data.status},
      acara = ${data.acara},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;

  return true;
}

// Delete attendance record
export async function deleteAttendance(id) {
  const sql = getDbClient();

  await sql`
    DELETE FROM attendance
    WHERE id = ${id}
  `;

  return true;
}

// ============================================
// POSITION RANKING FUNCTIONS
// ============================================

// Get all positions with rankings
export async function getAllPositions() {
  const sql = getDbClient();
  return await sql`SELECT * FROM position_ranking ORDER BY ranking_order ASC, position_name ASC`;
}

// Update ranking for a specific position
export async function updatePositionRanking(positionName, rankingOrder) {
  const sql = getDbClient();
  // Upsert
  await sql`
    INSERT INTO position_ranking (position_name, ranking_order)
    VALUES (${positionName}, ${rankingOrder})
    ON CONFLICT (position_name) 
    DO UPDATE SET ranking_order = ${rankingOrder}, updated_at = CURRENT_TIMESTAMP
  `;
  return true;
}

// Sync positions from staff table to ranking table
export async function syncPositionsFromStaff() {
  const sql = getDbClient();

  await sql`
    INSERT INTO position_ranking (position_name, ranking_order)
    SELECT DISTINCT position, 9999 
    FROM staff 
    WHERE position IS NOT NULL AND position != ''
    ON CONFLICT (position_name) DO NOTHING
  `;

  return true;
}

// Bulk update position rankings
export async function bulkUpdatePositionRankings(rankings) {
  const sql = getDbClient();

  if (!rankings || rankings.length === 0) return true;

  // Utilize Promise.all for parallel execution since 'neon' driver is stateless/HTTP
  // and doesn't support interactive transactions like .begin()
  await Promise.all(
    rankings.map(({ positionName, rankingOrder }) => {
      return sql`
      INSERT INTO position_ranking (position_name, ranking_order)
      VALUES (${positionName}, ${rankingOrder})
      ON CONFLICT (position_name) 
      DO UPDATE SET ranking_order = ${rankingOrder}, updated_at = CURRENT_TIMESTAMP
    `;
    }),
  );

  return true;
}
