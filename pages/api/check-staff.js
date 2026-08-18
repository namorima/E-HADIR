// pages/api/check-staff.js
// API route untuk semak ID staf - MIGRATED TO NEON DB

import {
  getStaffById,
  checkInvitation,
  getLastAttendance,
  getActiveEvent,
  initEventsTable,
} from "../../lib/db.js";

export default async function handler(req, res) {
  // Set CORS headers
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
    const { idStaf } = req.body;

    if (!idStaf) {
      return res.status(400).json({ error: "ID Staf is required" });
    }

    // Check if staff already has attendance record for the active event
    await initEventsTable();
    const activeEvent = await getActiveEvent();
    const lastRecord = activeEvent
      ? await getLastAttendance(idStaf, activeEvent.id)
      : null;

    if (lastRecord) {
      // Format timestamp for display
      const lastDate = formatDateTime(new Date(lastRecord.timestamp));
      const staffName = lastRecord.name;

      return res.status(200).json({
        status: "already_recorded",
        message: `ID Staf ${idStaf}, bernama ${staffName} sudah direkod pada ${lastDate}`,
        nama: staffName,
      });
    }

    // Check if staff exists in database
    const staff = await getStaffById(idStaf);

    if (staff) {
      // Check if staff is in invitation list
      const dalamJemputan = await checkInvitation(idStaf);

      return res.status(200).json({
        status: "success",
        nama: staff.name,
        jawatan: staff.position,
        lokasi: staff.location,
        dalamJemputan,
      });
    }

    return res.status(200).json({ status: "not_found" });
  } catch (error) {
    console.error("Error checking staff:", error);
    return res.status(500).json({
      error: "Failed to check staff",
      message: error.message,
    });
  }
}

function formatDateTime(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}
