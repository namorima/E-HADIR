// pages/api/staff/add.js
// Add new staff and record attendance - MIGRATED TO NEON DB

import { addStaff, getStaffById, recordAttendance } from "../../../lib/db.js";

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
    const { idStaf, nama, jawatan, lokasi } = req.body;

    if (!idStaf || !nama || !jawatan || !lokasi) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if staff ID already exists
    const existing = await getStaffById(idStaf);
    if (existing) {
      return res.status(200).json({
        success: false,
        status: "duplicate",
        message: `ID Staf ${idStaf} sudah wujud dalam sistem`,
      });
    }

    // Add to staff table
    await addStaff({
      id: idStaf,
      name: nama,
      position: jawatan,
      location: lokasi,
      unit: "",
      status: "WAKIL",
    });

    // Record attendance immediately
    const now = new Date();

    await recordAttendance({
      staffId: idStaf,
      name: nama,
      status: "WAKIL",
      timestamp: now,
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Staf baru berjaya didaftarkan dan kehadiran direkod!",
      nama: nama,
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
