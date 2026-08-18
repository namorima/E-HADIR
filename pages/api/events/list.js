// pages/api/events/list.js
import { initEventsTable, getAllEvents, getActiveEvent } from "../../../lib/db";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    await initEventsTable();
    const [events, activeEvent] = await Promise.all([
      getAllEvents(),
      getActiveEvent(),
    ]);

    return res.status(200).json({
      success: true,
      events,
      activeEventId: activeEvent ? activeEvent.id : null,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
