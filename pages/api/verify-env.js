// pages/api/verify-env.js
// Endpoint to verify environment variables are set correctly

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

  // Check all required environment variables
  const envCheck = {
    DATABASE_URL: {
      exists: !!process.env.DATABASE_URL,
      format: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
      valid: process.env.DATABASE_URL?.startsWith('postgresql://')
    },
    GOOGLE_CLIENT_EMAIL: {
      exists: !!process.env.GOOGLE_CLIENT_EMAIL,
      format: process.env.GOOGLE_CLIENT_EMAIL || 'NOT SET'
    },
    GOOGLE_SHEET_ID: {
      exists: !!process.env.GOOGLE_SHEET_ID,
      format: process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID.substring(0, 10) + '...' : 'NOT SET'
    },
    GOOGLE_PRIVATE_KEY: {
      exists: !!process.env.GOOGLE_PRIVATE_KEY,
      format: process.env.GOOGLE_PRIVATE_KEY ?
        (process.env.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') ? 'Valid format' : 'Invalid format') :
        'NOT SET',
      hasNewlines: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.includes('\n') : false
    },
    CLOUDINARY_CLOUD_NAME: {
      exists: !!process.env.CLOUDINARY_CLOUD_NAME,
      format: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET'
    },
    CLOUDINARY_API_KEY: {
      exists: !!process.env.CLOUDINARY_API_KEY,
      format: process.env.CLOUDINARY_API_KEY ? 'SET (hidden)' : 'NOT SET'
    },
    CLOUDINARY_API_SECRET: {
      exists: !!process.env.CLOUDINARY_API_SECRET,
      format: process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'NOT SET'
    },
    NEXT_PUBLIC_ADMIN_PASSWORD: {
      exists: !!process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
      format: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ? 'SET (hidden)' : 'NOT SET'
    }
  };

  // Overall status
  const allSet = Object.values(envCheck).every(check => check.exists);
  const missingVars = Object.entries(envCheck)
    .filter(([key, value]) => !value.exists)
    .map(([key]) => key);

  return res.status(200).json({
    success: allSet,
    message: allSet ? 'All environment variables are set' : 'Some environment variables are missing',
    missingVariables: missingVars,
    details: envCheck,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}
