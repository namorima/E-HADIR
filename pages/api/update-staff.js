// pages/api/update-staff.js
// Update staff data - MIGRATED TO NEON DB

import { updateStaff, getStaffById } from "../../lib/db";

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
    const { id, name, position, location, unit, status, jantina } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Staff ID is required",
      });
    }

    // Check if staff exists
    const existing = await getStaffById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    // Update staff
    await updateStaff(id, {
      name: name || existing.name,
      position: position || existing.position,
      location: location || existing.location,
      unit: unit || existing.unit,
      status: status || existing.status,
      jantina: jantina || existing.jantina,
    });

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update staff",
      message: error.message,
    });
  }
}
