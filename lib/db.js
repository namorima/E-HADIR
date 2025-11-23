// lib/db.js
// Database connection helper for Neon PostgreSQL

import { neon } from '@neondatabase/serverless';

// Initialize Neon client
export function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in environment variables');
    throw new Error('DATABASE_URL environment variable is required');
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

  if (result[0].count === '0') {
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
      title: 'LAPORAN KEHADIRAN',
      date: '',
      location: 'ARAS 2, BILIK MESYUARAT PEJABAT PENGARAH NEGERI',
      logo_url: 'https://serveproxy.com/?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fjohnadik%2Fkehadiran2%40main%2Flogo3.png',
      status: 'on',
      background_light_url: 'https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F1763628916sm154%3Falt%3Dmedia%26token%3Da410e76c-3a5f-4c05-b7f1-d78332b8aa24',
      background_dark_url: 'https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F17636288930klr%3Falt%3Dmedia%26token%3D9e98b210-518b-4348-8aa8-76c937cba161'
    };
  }

  return result[0];
}

// Update admin settings
export async function updateAdminSettings(settings) {
  const sql = getDbClient();

  // Get current settings ID
  const current = await sql`SELECT id FROM admin_settings ORDER BY id DESC LIMIT 1`;

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
        ${settings.title || ''},
        ${settings.date || ''},
        ${settings.location || ''},
        ${settings.logo || ''},
        ${settings.status || 'on'},
        ${settings.backgroundLight || ''},
        ${settings.backgroundDark || ''},
        CURRENT_TIMESTAMP
      )
    `;
  } else {
    // Update existing settings
    await sql`
      UPDATE admin_settings
      SET
        title = ${settings.title || ''},
        date = ${settings.date || ''},
        location = ${settings.location || ''},
        logo_url = ${settings.logo || ''},
        status = ${settings.status || 'on'},
        background_light_url = ${settings.backgroundLight || ''},
        background_dark_url = ${settings.backgroundDark || ''},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${current[0].id}
    `;
  }

  return true;
}
