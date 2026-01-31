// pages/api/positions/sync.js
import { syncPositionsFromStaff } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    await syncPositionsFromStaff();
    return res
      .status(200)
      .json({ success: true, message: "Positions synchronized" });
  } catch (error) {
    console.error("Error syncing positions:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
