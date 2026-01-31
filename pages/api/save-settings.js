// pages/api/save-settings.js
import { updateAdminSettings, initDatabase } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const settings = req.body;

  try {
    await initDatabase();
    await updateAdminSettings(settings);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving admin settings:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
