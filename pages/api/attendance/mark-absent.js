// pages/api/attendance/mark-absent.js
// Once the active event's date has passed (Asia/Kuala_Lumpur), records
// TIDAK HADIR for every invited staff member who never checked in.
// Called by setup.html when an admin opens it; safe to call repeatedly.

import {
  getActiveEvent,
  initEventsTable,
  markAbsentForEvent,
} from "../../../lib/db.js";

// Event dates are stored as free text, normally dd/mm/yyyy (setup.html's
// date picker). Returns "yyyy-mm-dd", or null if the date can't be read.
function parseEventDate(value) {
  const m = String(value || "")
    .trim()
    .match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const day = Number(d);
  const month = Number(mo);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayInMalaysia() {
  // en-CA formats as yyyy-mm-dd
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date());
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    await initEventsTable();
    const event = await getActiveEvent();
    if (!event) {
      return res.json({ success: true, marked: 0, reason: "no_active_event" });
    }

    const eventDate = parseEventDate(event.date);
    if (!eventDate) {
      return res.json({ success: true, marked: 0, reason: "unreadable_date", eventId: event.id });
    }

    // Only after the event day has fully ended in Malaysia.
    if (eventDate >= todayInMalaysia()) {
      return res.json({ success: true, marked: 0, reason: "not_past", eventId: event.id });
    }

    const marked = await markAbsentForEvent(event.id, event.title);
    return res.json({ success: true, marked, eventId: event.id, eventTitle: event.title });
  } catch (error) {
    console.error("Error marking absent staff:", error);
    return res.status(500).json({ success: false, error: "Failed to mark absent staff" });
  }
}
