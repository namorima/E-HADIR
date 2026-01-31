// pages/api/db/init.js
// Initialize database tables

import { initDatabase, initStaffTables } from "../../../lib/db.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Initialize admin settings table
    await initDatabase();

    // Initialize staff, invitations, and attendance tables
    await initStaffTables();

    return res.status(200).json({
      success: true,
      message: "Database initialized successfully! All tables created.",
      tables: ["admin_settings", "staff", "invitations", "attendance"],
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to initialize database",
      message: error.message,
    });
  }
}
