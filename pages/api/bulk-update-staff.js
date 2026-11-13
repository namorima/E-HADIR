// pages/api/bulk-update-staff.js
import {
  bulkUpdateStaffStatus,
  initStaffTables,
  initEventsTable,
  syncActiveEventInvitations,
} from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { ids, field, value } = req.body;

  if (!ids || !field || value === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  if (field !== "status") {
    return res
      .status(400)
      .json({
        success: false,
        error: "Only status field can be updated in bulk",
      });
  }

  try {
    await initStaffTables();
    await initEventsTable();
    await bulkUpdateStaffStatus(ids, value);
    // JEMPUTAN / TIADA / WAKIL here means invited or not to the active event.
    await syncActiveEventInvitations(ids, value);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
