// pages/api/get-staff.js
// Get all staff data from Google Sheets

import { google } from "googleapis";

const SHEET_NAME = "DATA STAF";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Get all staff data (skip header row)
    // Columns: A=ID STAF, B=NAMA, C=JAWATAN, D=LOKASI, E=UNIT, F=JEMPUTAN
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:F`,
    });

    const rows = response.data.values || [];
    const staff = rows.map((row, index) => ({
      id: row[0] || "",
      name: row[1] || "",
      position: row[2] || "",
      location: row[3] || "",
      unit: row[4] || "",
      invitation: row[5] || "",
      rowIndex: index + 2 // +2 because row 1 is header, and array is 0-indexed
    }));

    return res.status(200).json({
      success: true,
      staff: staff
    });

  } catch (error) {
    console.error('Error fetching staff data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch staff data',
      message: error.message
    });
  }
}
