// pages/api/bulk-delete-staff.js
import { bulkDeleteStaff, initStaffTables } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid staff IDs" });
  }

  try {
    await initStaffTables();
    await bulkDeleteStaff(ids);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
