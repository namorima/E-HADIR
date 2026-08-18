// pages/api/attendance/list.js
import {
  getAllAttendance,
  getActiveEvent,
  initEventsTable,
} from "../../../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    await initEventsTable();

    let eventId = req.query.event_id;
    if (!eventId) {
      const activeEvent = await getActiveEvent();
      eventId = activeEvent ? activeEvent.id : null;
    }

    const attendance = await getAllAttendance(eventId);
    return res.status(200).json({ success: true, attendance, eventId });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch attendance" });
  }
}
