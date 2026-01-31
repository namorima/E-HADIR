import { recordAttendance, updateAttendance } from "../../../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { attendId, staffId, name, status, acara } = req.body;

    if (!staffId && !attendId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    if (attendId) {
      // Update existing
      await updateAttendance(attendId, { name, status, acara });
      return res.json({ success: true, message: "Attendance updated" });
    } else {
      // Create new
      await recordAttendance({
        staffId,
        name,
        status: status || "HADIR", // Default if missing
        acara: acara || "",
        timestamp: new Date().toISOString(),
      });
      return res.json({ success: true, message: "Attendance recorded" });
    }
  } catch (error) {
    console.error("Error processing admin attendance:", error);
    return res.status(500).json({ success: false, error: "Operation failed" });
  }
}
