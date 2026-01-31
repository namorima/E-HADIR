// pages/api/positions/list.js
import { getAllPositions } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const data = await getAllPositions();
    return res.status(200).json({ success: true, positions: data });
  } catch (error) {
    console.error("Error listing positions:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
