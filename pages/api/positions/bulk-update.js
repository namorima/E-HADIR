// pages/api/positions/bulk-update.js
import { bulkUpdatePositionRankings } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { rankings } = req.body;

  if (!rankings || !Array.isArray(rankings)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid data format" });
  }

  try {
    await bulkUpdatePositionRankings(rankings);
    return res
      .status(200)
      .json({ success: true, message: "Rankings updated successfully" });
  } catch (error) {
    console.error("Error bulk updating rankings:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
