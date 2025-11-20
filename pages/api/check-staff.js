// pages/api/check-staff.js
// API route untuk semak ID staf

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
    const { idStaf } = req.body;

    if (!idStaf) {
      return res.status(400).json({ error: 'ID Staf is required' });
    }

    // Initialize Google Sheets API with Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Fetch data from multiple sheets
    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['DATA STAF!A:F', 'DATA JEMPUTAN!A:F', 'KEHADIRAN!A:F']
    });

    const valueRanges = batchResponse.data.valueRanges || [];

    const dataStaf = valueRanges[0]?.values || [];
    const dataJemputan = valueRanges[1]?.values || [];
    const kehadiranData = valueRanges[2]?.values || [];
    
    // Semak jika ID STAF wujud dalam KEHADIRAN
    let lastRecord = null;
    for (let j = kehadiranData.length - 1; j >= 1; j--) {
      if (kehadiranData[j][1] == idStaf) {
        lastRecord = kehadiranData[j];
        break;
      }
    }
    
    if (lastRecord) {
      // Parse Malaysian date format: "21/11/2025 01:17:13"
      const dateString = lastRecord[0];
      let lastDate = dateString; // Use original if parsing fails

      try {
        // Split date and time: "21/11/2025 01:17:13" -> ["21/11/2025", "01:17:13"]
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');

        // Create Date object (month is 0-indexed in JavaScript)
        const parsedDate = new Date(year, month - 1, day, hour, minute, second);

        // Format it properly
        lastDate = formatDateTime(parsedDate);
      } catch (error) {
        console.error('Error parsing date:', error);
        // Keep original dateString if parsing fails
      }

      const staffName = lastRecord[2];

      return res.status(200).json({
        status: "already_recorded",
        message: `ID Staf ${idStaf}, bernama ${staffName} sudah direkod pada ${lastDate}`,
        nama: staffName
      });
    }

    // Semak jika ID STAF wujud dalam DATA STAF
    for (let i = 1; i < dataStaf.length; i++) {
      if (dataStaf[i][0] == idStaf) {
        const nama = dataStaf[i][1];
        const jawatan = dataStaf[i][2];
        const lokasi = dataStaf[i][3];
        const dalamJemputan = dataJemputan.some(row => row[0] == idStaf);
        
        return res.status(200).json({
          status: "success",
          nama,
          jawatan,
          lokasi,
          dalamJemputan
        });
      }
    }
    
    return res.status(200).json({ status: "not_found" });
    
  } catch (error) {
    console.error('Error checking staff:', error);
    return res.status(500).json({ 
      error: 'Failed to check staff',
      message: error.message 
    });
  }
}

function formatDateTime(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}
