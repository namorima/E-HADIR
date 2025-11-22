// pages/api/delete-staff.js
// Delete staff from Google Sheets

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
    const { rowIndex } = req.body;

    if (!rowIndex) {
      return res.status(400).json({
        success: false,
        message: 'Row Index is required'
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

    // Get sheet ID
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId
    });

    const sheet = sheetMetadata.data.sheets.find(
      s => s.properties.title === SHEET_NAME
    );

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    const sheetId = sheet.properties.sheetId;

    // Delete the row (rowIndex is 1-based, API uses 0-based)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // Convert to 0-based
              endIndex: rowIndex
            }
          }
        }]
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting staff:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete staff',
      message: error.message
    });
  }
}
