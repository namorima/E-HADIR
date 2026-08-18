// pages/api/save-settings.js
import { getActiveEvent, updateEvent, initEventsTable } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const settings = req.body;

  try {
    await initEventsTable();
    const active = await getActiveEvent();
    if (active) {
      await updateEvent(active.id, settings);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving admin settings:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
