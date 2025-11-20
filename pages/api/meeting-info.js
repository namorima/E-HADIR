// pages/api/meeting-info.js
// API route untuk fetch meeting info dari Google Sheets

import { google } from "googleapis";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Initialize Google Sheets API with Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Fetch data dari FX sheet (K1:K6)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "FX!K1:K6",
    });

    const values = response.data.values || [];

    // Default values - Updated backgrounds
    const defaultLogo =
      "https://serveproxy.com/?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fjohnadik%2Fkehadiran2%40main%2Flogo3.png";
    const defaultBackgroundLight =
      "https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F1763628916sm154%3Falt%3Dmedia%26token%3Da410e76c-3a5f-4c05-b7f1-d78332b8aa24";
    const defaultBackgroundDark =
      "https://serveproxy.com/?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fmycdn-b2313.appspot.com%2Fo%2F17636288930klr%3Falt%3Dmedia%26token%3D9e98b210-518b-4348-8aa8-76c937cba161";

    // Extract values

    //const title = values[0]?.[0] || "LAPORAN KEHADIRAN";
    //const date = values[1]?.[0] || formatDateToMalay(new Date());
    //const location = values[2]?.[0] || "ARAS 2, BILIK MESYUARAT PEJABAT PENGARAH NEGERI";
    //const logo = values[3]?.[0] || defaultLogo;
    //const formStatus = (values[4]?.[0] || "on").toString().toLowerCase();
    //const backgroundUrl = values[5]?.[0] || "";

    const title = values[0]?.[0] || "LAPORAN KEHADIRAN";
    const date = values[1]?.[0] || formatDateToMalay(new Date());
    const location = values[2]?.[0] || "ARAS 2, BILIK MESYUARAT PEJABAT PENGARAH NEGERI";
    const logo = defaultLogo;
    const formStatus = (values[4]?.[0] || "on").toString().toLowerCase();
    const backgroundUrl = values[5]?.[0] || "";

    // Return meeting info
    return res.status(200).json({
      success: true,
      data: {
        title,
        date,
        location,
        logo,
        formStatus,
        backgroundUrlLight: defaultBackgroundLight,
        //backgroundUrlLight: backgroundUrl || defaultBackgroundLight,
        backgroundUrlDark: defaultBackgroundDark,
      },
    });
  } catch (error) {
    console.error("Error fetching meeting info:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch meeting info",
      message: error.message,
    });
  }
}

// Helper function to format date to Malay
function formatDateToMalay(date) {
  const months = [
    "JANUARI",
    "FEBRUARI",
    "MAC",
    "APRIL",
    "MEI",
    "JUN",
    "JULAI",
    "OGOS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DISEMBER",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
