// pages/api/staff/add.js
// Add new staff using Service Account

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
    const { idStaf, nama, jawatan, lokasi } = req.body;
    
    if (!idStaf || !nama || !jawatan || !lokasi) {
      return res.status(400).json({ error: 'All fields are required' });
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

    // Check if staff ID already exists
    const dataStafResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA STAF!A:A',
    });

    const existingIds = (dataStafResponse.data.values || []).flat();
    if (existingIds.includes(idStaf)) {
      return res.status(200).json({
        success: false,
        status: "duplicate",
        message: `ID Staf ${idStaf} sudah wujud dalam sistem`
      });
    }

    // Add to DATA STAF sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'DATA STAF!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[idStaf, nama, jawatan, lokasi, "", "WAKIL"]]
      }
    });

    // Add to KEHADIRAN sheet
    const now = new Date();
    const timestamp = formatDate(now);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'KEHADIRAN!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, idStaf, nama, "WAKIL"]]
      }
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Staf baru berjaya didaftarkan dan kehadiran direkod!",
      nama: nama
    });

  } catch (error) {
    console.error('Error adding staff:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add staff',
      message: error.message
    });
  }
}

function formatDate(date) {
  const options = {
    timeZone: 'Asia/Kuala_Lumpur',
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
