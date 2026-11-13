// pages/api/events/activate.js
import {
  initEventsTable,
  setActiveEvent,
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
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: "id diperlukan" });
    }

    await initEventsTable();

    // Switching ends the current event (unless it's the same one).
    const current = await getActiveEvent();
    const previous = current && current.id !== id ? current : null;
    if (previous) await ensureEventInvitations(previous.id);

    await setActiveEvent(id);
    // Seeds only if this event has never had an invitation list.
    await ensureEventInvitations(id);

    // Invitees of the event that just ended who never checked in become
    // TIDAK HADIR (still editable in the Kehadiran tab).
    const markedAbsent = previous
      ? await markAbsentForEvent(previous.id, previous.title)
      : 0;

    return res.status(200).json({
      success: true,
      markedAbsent,
      previousEventTitle: previous ? previous.title : null,
    });
  } catch (error) {
    console.error("Error activating event:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
