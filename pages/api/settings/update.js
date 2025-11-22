// pages/api/settings/update.js
// Update admin settings in Database

import { updateAdminSettings } from '../../../lib/db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, date, location, logo, backgroundLight, backgroundDark, status } = req.body;

    // Update settings in database
    await updateAdminSettings({
      title: title || "",
      date: date || "",
      location: location || "",
      logo: logo || "",
      status: status || "on",
      backgroundLight: backgroundLight || "",
      backgroundDark: backgroundDark || ""
    });

    return res.status(200).json({
      success: true,
      message: "Tetapan berjaya dikemaskini!"
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
}
