// pages/api/events/update.js
import { initEventsTable, updateEvent } from "../../../lib/db";

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
    await updateEvent(id, req.body);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
