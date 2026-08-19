// pages/api/get-staff.js
// Get all staff data - MIGRATED TO NEON DB

import { getAllStaff } from "../../lib/db";

export default async function handler(req, res) {
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
    const staffData = await getAllStaff();

    // Transform to match expected format
    const staff = staffData.map((row, index) => ({
      id: row.id,
      name: row.name,
      position: row.position || "",
      location: row.location || "",
      unit: row.unit || "",
      jantina: row.jantina || "",
      invitation: row.status || "",
      status: row.status || "",
      ranking_order: row.ranking_order || 9999,
      rowIndex: index + 2, // Keep for compatibility
    }));

    return res.status(200).json({
      success: true,
      staff: staff,
    });
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch staff data",
      message: error.message,
    });
  }
}
