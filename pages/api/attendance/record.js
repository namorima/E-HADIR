// pages/api/attendance/record.js
// Record attendance - MIGRATED TO NEON DB

import {
  checkInvitation,
  recordAttendance,
  updateStaffStatus,
  getStaffById,
  getActiveEvent,
  initEventsTable,
  detectGender,
  ensureEventInvitations,
} from "../../../lib/db.js";

// ENCIK for lelaki (BIN), PUAN for perempuan (BINTI)
function panggilanFor(jantina) {
  if (jantina === "L") return "ENCIK";
  if (jantina === "P") return "PUAN";
  return "";
}

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
    const { idStaf, nama, jenis } = req.body;

    if (!idStaf || !nama) {
      return res.status(400).json({ error: "ID Staf and Nama are required" });
    }

    // Get active event for event title/id
    await initEventsTable();
    const activeEvent = await getActiveEvent();
    if (!activeEvent) {
      return res.status(400).json({ error: "Tiada acara aktif ditetapkan" });
    }
    const eventName = activeEvent.title || "Default Event";

    // HADIR if invited to the active event, otherwise WAKIL
    await ensureEventInvitations(activeEvent.id);
    const isInvited = await checkInvitation(idStaf, activeEvent.id);
    const statusJemputan = isInvited ? "HADIR" : "WAKIL";

    // Get current staff to check if status needs updating
    const staff = await getStaffById(idStaf);

    // Update staff status if empty
    if (staff && (!staff.status || staff.status === "")) {
      await updateStaffStatus(idStaf, statusJemputan);
    }

    // Record attendance against the active event
    await recordAttendance({
      staffId: idStaf,
      name: nama,
      status: statusJemputan,
      timestamp: new Date(),
      acara: eventName,
      eventId: activeEvent.id,
    });

    const jantina = staff?.jantina || detectGender(nama);

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Rekod berjaya disimpan!",
      nama: nama,
      jantina: jantina,
      panggilan: panggilanFor(jantina),
    });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to record attendance",
      message: error.message,
    });
  }
}

// Helper function for date formatting
const Utilities = {
  formatDate(date, timeZone, format) {
    const options = {
      timeZone: timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    const formatter = new Intl.DateTimeFormat("en-MY", options);
    const parts = formatter.formatToParts(date);

    const getValue = (type) => parts.find((part) => part.type === type)?.value;

    return `${getValue("day")}/${getValue("month")}/${getValue("year")} ${getValue("hour")}:${getValue("minute")}:${getValue("second")} ${getValue("dayPeriod")}`;
  },
};
