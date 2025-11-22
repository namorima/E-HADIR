// pages/api/db/init.js
// Initialize database (create table and insert defaults)

import { initDatabase } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDatabase();

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully!'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize database',
      message: error.message
    });
  }
}
