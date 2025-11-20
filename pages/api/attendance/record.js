// pages/api/attendance/record.js
// Direct write to Google Sheets using Service Account (BEST METHOD!)

import { google } from 'googleapis';

export default async function handler(req, res) {
  // Set CORS headers
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
    const { idStaf, nama, jenis } = req.body;
    
    if (!idStaf || !nama) {
      return res.status(400).json({ error: 'ID Staf and Nama are required' });
    }

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

    // First, check status in DATA STAF sheet
    const dataStafResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA STAF!A:F',
    });

    const dataStaf = dataStafResponse.data.values || [];
    let statusJemputan = "WAKIL";
    let rowStaf = -1;

    // Find staff in DATA STAF
    for (let i = 1; i < dataStaf.length; i++) {
      if (dataStaf[i][0] == idStaf) {
        if (dataStaf[i][5] === "JEMPUTAN") {
          statusJemputan = "HADIR";
        }
        rowStaf = i + 1;
        break;
      }
    }

    // Update DATA STAF if needed
    if (rowStaf > 0 && (!dataStaf[rowStaf - 1][5] || dataStaf[rowStaf - 1][5] === "")) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `DATA STAF!F${rowStaf}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [["WAKIL"]]
        }
      });
    }

    // Append to KEHADIRAN sheet
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy hh:mm:ss a');
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'KEHADIRAN!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, idStaf, nama, statusJemputan]]
      }
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Rekod berjaya disimpan!",
      nama: nama
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record attendance',
      message: error.message
    });
  }
}

// Helper function for date formatting
const Utilities = {
  formatDate(date, timeZone, format) {
    const options = {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    const formatter = new Intl.DateTimeFormat('en-MY', options);
    const parts = formatter.formatToParts(date);
    
    const getValue = (type) => parts.find(part => part.type === type)?.value;
    
    return `${getValue('day')}/${getValue('month')}/${getValue('year')} ${getValue('hour')}:${getValue('minute')}:${getValue('second')} ${getValue('dayPeriod')}`;
  }
};
