import {
  recordAttendance,
  updateAttendance,
  getActiveEvent,
  getEventById,
  initEventsTable,
} from "../../../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { attendId, staffId, name, status, acara, eventId } = req.body;

    if (!staffId && !attendId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    if (attendId) {
      // Update existing
      await updateAttendance(attendId, { name, status, acara: acara || "" });
      return res.json({ success: true, message: "Attendance updated" });
    }

    // Create new: attach it to the event the admin is viewing (falling back
    // to the active event) so it shows up in that event's list.
    await initEventsTable();
    const event = eventId ? await getEventById(eventId) : await getActiveEvent();
    if (!event) {
      return res
        .status(400)
        .json({ success: false, error: "Event tidak dijumpai" });
    }

    await recordAttendance({
      staffId,
      name,
      status: status || "HADIR", // Default if missing
      acara: acara || event.title || "",
      timestamp: new Date().toISOString(),
      eventId: event.id,
    });
    return res.json({ success: true, message: "Attendance recorded" });
  } catch (error) {
    console.error("Error processing admin attendance:", error);
    return res.status(500).json({ success: false, error: "Operation failed" });
  }
}
