// pages/api/add-staff.js
// Add new staff - MIGRATED TO NEON DB

import { addStaff, getStaffById } from "../../lib/db";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, name, position, location, unit, status } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: "ID and Name are required",
      });
    }

    // Check if staff already exists
    const existing = await getStaffById(id);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Staff ID already exists",
      });
    }

    // Add new staff
    await addStaff({
      id,
      name,
      position: position || "",
      location: location || "",
      unit: unit || "",
      status: status || "",
    });

    return res.status(200).json({
      success: true,
      message: "Staff added successfully",
    });
  } catch (error) {
    console.error("Error adding staff:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to add staff",
      message: error.message,
    });
  }
}
