// pages/api/delete-staff.js
// Delete staff - MIGRATED TO NEON DB

import { deleteStaff, getStaffById } from "../../lib/db";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;

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

    // Delete staff (CASCADE will delete related records)
    await deleteStaff(id);

    return res.status(200).json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete staff",
      message: error.message,
    });
  }
}
