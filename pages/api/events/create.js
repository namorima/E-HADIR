// pages/api/events/create.js
import {
  initEventsTable,
  createEvent,
  ensureEventInvitations,
  getActiveEvent,
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
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Tajuk acara diperlukan" });
    }

    await initEventsTable();

    // Creating an event ends the current one. Make sure its invitation list
    // exists while it is still active (only the active event is seeded).
    const previous = await getActiveEvent();
    if (previous) await ensureEventInvitations(previous.id);

    const id = await createEvent(req.body);
    // New events start with the current invitation list (copied forward).
    await ensureEventInvitations(id);

    // Invitees of the event that just ended who never checked in become
    // TIDAK HADIR (still editable in the Kehadiran tab).
    const markedAbsent = previous
      ? await markAbsentForEvent(previous.id, previous.title)
      : 0;

    return res.status(200).json({
      success: true,
      id,
      markedAbsent,
      previousEventTitle: previous ? previous.title : null,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
