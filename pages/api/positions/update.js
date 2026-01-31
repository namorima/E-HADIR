// pages/api/positions/update.js
import { updatePositionRanking } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { positionName, rankingOrder } = req.body;

  if (!positionName) {
    return res
      .status(400)
      .json({ success: false, error: "Position name is required" });
  }

  try {
    await updatePositionRanking(positionName, parseInt(rankingOrder) || 9999);
    return res.status(200).json({ success: true, message: "Ranking updated" });
  } catch (error) {
    console.error("Error updating ranking:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
