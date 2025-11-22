// pages/api/upload/image.js
// Upload image to Cloudinary

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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
    const { image, folder, type } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Determine folder based on type
    const uploadFolder = folder || `ehadir/${type || 'general'}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: uploadFolder,
      resource_type: 'auto',
      transformation: [
        {
          quality: 'auto:best',
          fetch_format: 'auto'
        }
      ]
    });

    // Add serveproxy prefix to Cloudinary URL
    const imageUrl = result.secure_url;
    const proxiedUrl = `https://serveproxy.com/?url=${encodeURIComponent(imageUrl)}`;

    return res.status(200).json({
      success: true,
      url: proxiedUrl,
      originalUrl: imageUrl,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    });

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      message: error.message
    });
  }
}
