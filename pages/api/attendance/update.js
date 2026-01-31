// pages/api/attendance/update.js
import { updateAttendance } from "../../../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id, name, status, acara } = req.body;
    if (!id)
      return res.status(400).json({ success: false, error: "ID is required" });

    await updateAttendance(id, { name, status, acara });
    return res
      .status(200)
      .json({ success: true, message: "Attendance updated" });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update attendance" });
  }
}
