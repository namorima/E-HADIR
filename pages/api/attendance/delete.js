// pages/api/attendance/delete.js
import { deleteAttendance } from "../../../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id } = req.body;
    if (!id)
      return res.status(400).json({ success: false, error: "ID is required" });

    await deleteAttendance(id);
    return res
      .status(200)
      .json({ success: true, message: "Attendance deleted" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete attendance" });
  }
}
