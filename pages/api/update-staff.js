// pages/api/update-staff.js
// Update staff data in Google Sheets

import { google } from "googleapis";

const SHEET_NAME = "DATA STAF";

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
    const { id, name, position, location, unit, invitation, rowIndex } = req.body;

    if (!id || !name || !rowIndex) {
      return res.status(400).json({
        success: false,
        message: 'ID, Name, and Row Index are required'
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Update specific row
    // Columns: A=ID STAF, B=NAMA, C=JAWATAN, D=LOKASI, E=UNIT, F=JEMPUTAN
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A${rowIndex}:F${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, name, position || "", location || "", unit || "", invitation || ""]]
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Staff updated successfully'
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update staff',
      message: error.message
    });
  }
}
