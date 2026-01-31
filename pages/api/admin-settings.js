// pages/api/admin-settings.js
import { getAdminSettings, initDatabase } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    await initDatabase();
    const settings = await getAdminSettings();
    return res.status(200).json({
      title: settings.title,
      location: settings.location,
      date: settings.date,
      status: settings.status,
      logo: settings.logo_url,
      backgroundLight: settings.background_light_url,
      backgroundDark: settings.background_dark_url,
    });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
