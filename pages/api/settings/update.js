// pages/api/settings/update.js
// Update FX settings using Service Account

import { google } from 'googleapis';

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
    const { title, date, location, logo, background, status } = req.body;

    // Initialize Google Sheets API with Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Handle date format (DD/MM/YYYY)
    let dateValue = date || "";
    
    // Update FX sheet K1:K6
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'FX!K1:K6',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [title || ""],
          [dateValue],
          [location || ""],
          [logo || ""],
          [status || "on"],
          [background || ""]
        ]
      }
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
