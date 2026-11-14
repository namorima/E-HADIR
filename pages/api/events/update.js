// pages/api/events/update.js
import {
  initEventsTable,
  updateEvent,
  getEventById,
  ensureEventInvitations,
  markAbsentForEvent,
} from "../../../lib/db";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const { id, title } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: "id diperlukan" });
    }
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Tajuk acara diperlukan" });
    }

    await initEventsTable();

    const before = await getEventById(id);
    if (!before) {
      return res.status(404).json({ success: false, error: "Event tidak dijumpai" });
    }
    // Make sure the invitation list exists (seeds only the active event).
    await ensureEventInvitations(id);

    await updateEvent(id, req.body);

    // Closing the attendance form (status on -> off) ends check-in for this
    // event: its invitees who never checked in become TIDAK HADIR (still
    // editable in the Kehadiran tab). Saving an already-closed form, or
    // re-opening it, marks nobody.
    const closing = before.status !== "off" && (req.body.status || "on") === "off";
    const markedAbsent = closing ? await markAbsentForEvent(id, title) : 0;

    return res.status(200).json({ success: true, markedAbsent, eventTitle: title });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
