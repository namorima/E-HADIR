// pages/api/db/migrate.js
// One-time migration script to import data from Google Sheets to Neon DB

import { google } from "googleapis";
import {
  addStaff,
  addInvitation,
  recordAttendance,
  getStaffById,
} from "../../../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use POST to migrate." });
  }

  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Fetch all data from Google Sheets
    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ["DATA STAF!A:F", "DATA JEMPUTAN!A:F", "KEHADIRAN!A:D"],
    });

    const valueRanges = batchResponse.data.valueRanges || [];
    const dataStaf = valueRanges[0]?.values || [];
    const dataJemputan = valueRanges[1]?.values || [];
    const kehadiranData = valueRanges[2]?.values || [];

    let staffCount = 0;
    let invitationCount = 0;
    let attendanceCount = 0;
    let errors = [];

    // Migrate DATA STAF (skip header row)
    for (let i = 1; i < dataStaf.length; i++) {
      try {
        const row = dataStaf[i];
        if (!row[0] || !row[1]) continue; // Skip if no ID or name

        // Check if already exists
        const existing = await getStaffById(row[0]);
        if (existing) {
          console.log(`Staff ${row[0]} already exists, skipping...`);
          continue;
        }

        await addStaff({
          id: row[0],
          name: row[1],
          position: row[2] || "",
          location: row[3] || "",
          unit: row[4] || "",
          status: row[5] || "",
        });
        staffCount++;
      } catch (error) {
        errors.push(`Staff row ${i}: ${error.message}`);
      }
    }

    // Migrate DATA JEMPUTAN (skip header row)
    for (let i = 1; i < dataJemputan.length; i++) {
      try {
        const row = dataJemputan[i];
        if (!row[0]) continue; // Skip if no staff ID

        await addInvitation(row[0], "default");
        invitationCount++;
      } catch (error) {
        errors.push(`Invitation row ${i}: ${error.message}`);
      }
    }

    // Migrate KEHADIRAN (skip header row)
    for (let i = 1; i < kehadiranData.length; i++) {
      try {
        const row = kehadiranData[i];
        if (!row[0] || !row[1] || !row[2]) continue; // Skip if missing data

        // Parse Malaysian date format: "21/11/2025 01:17:13 PM"
        const timestamp = parseMalaysianDate(row[0]);

        await recordAttendance({
          staffId: row[1],
          name: row[2],
          status: row[3] || "WAKIL",
          timestamp: timestamp,
        });
        attendanceCount++;
      } catch (error) {
        errors.push(`Attendance row ${i}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Migration completed!",
      summary: {
        staff: staffCount,
        invitations: invitationCount,
        attendance: attendanceCount,
        errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (error) {
    console.error("Error during migration:", error);
    return res.status(500).json({
      success: false,
      error: "Migration failed",
      message: error.message,
    });
  }
}

// Helper function to parse Malaysian date format
function parseMalaysianDate(dateString) {
  try {
    // Format: "21/11/2025 01:17:13 PM"
    const [datePart, timePart, ampm] = dateString.split(" ");
    const [day, month, year] = datePart.split("/");
    const [hour, minute, second] = timePart.split(":");

    let hours = parseInt(hour);
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return new Date(year, month - 1, day, hours, minute, second);
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return new Date(); // Fallback to current date
  }
}
