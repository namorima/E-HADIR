# Cloudinary Image Upload Setup Guide

## Pendahuluan

Sistem E-HADIR kini support **automatic image upload** ke Cloudinary untuk Logo dan Background images. Admin tidak perlu manual upload dan copy URL lagi!

## Features

✅ **Drag & Drop Upload** - Pilih gambar dan auto-upload
✅ **Auto ServeProxy** - URL automatically wrapped dengan serveproxy
✅ **Progress Indicator** - Real-time upload status
✅ **Size Validation** - Max 5MB per image
✅ **Cloud Storage** - Gambar disimpan permanent di Cloudinary
✅ **Free Tier** - Cloudinary free tier cukup untuk production

## Setup Steps

### 1. Create Cloudinary Account

1. Visit [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for FREE account
3. Verify email

### 2. Get Cloudinary Credentials

1. Login ke [Cloudinary Console](https://console.cloudinary.com/)
2. Dashboard akan show:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Update Environment Variables

Edit `.env.local` dan update:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

**PENTING**: Ganti dengan credentials sebenar dari Cloudinary Dashboard!

### 4. Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## How It Works

### Upload Flow:

```
1. Admin clicks "📤 Upload" button
   ↓
2. File picker opens
   ↓
3. Admin selects image file
   ↓
4. Client validates (type, size)
   ↓
5. Convert to base64
   ↓
6. POST to /api/upload/image
   ↓
7. Server uploads to Cloudinary
   ↓
8. Server adds serveproxy prefix
   ↓
9. Return proxied URL to client
   ↓
10. URL auto-filled in input field
```

### Image Organization

Images are organized in Cloudinary folders:

```
ehadir/
├── logo/          - Logo images
├── bgLight/       - Light mode backgrounds
└── bgDark/        - Dark mode backgrounds
```

## Usage Guide

### For Admin Users:

1. **Login Admin**
   - ID: 0000
   - Password: onearekeamall

2. **Upload Logo**
   - Click "📤 Upload" next to LOGO field
   - Select image file (PNG, JPG, etc.)
   - Wait for "✅ Upload berjaya!"
   - URL auto-populated

3. **Upload Background (Light)**
   - Click "📤 Upload" next to BACKGROUND (LIGHT MODE)
   - Select image
   - Wait for confirmation

4. **Upload Background (Dark)**
   - Click "📤 Upload" next to BACKGROUND (DARK MODE)
   - Select image
   - Wait for confirmation

5. **Save Settings**
   - Click "Simpan Tetapan"
   - Settings saved to database
   - Page reloads with new images

## File Specifications

### Supported Formats:
- ✅ PNG
- ✅ JPG/JPEG
- ✅ WebP
- ✅ GIF
- ✅ SVG

### Size Limits:
- **Maximum**: 5MB per file
- **Recommended**: Under 2MB for faster upload

### Recommended Dimensions:
- **Logo**: 200x200px to 500x500px (square or landscape)
- **Background**: 1920x1080px or higher (landscape)

### Image Optimization:

Cloudinary automatically:
- ✅ Compresses images
- ✅ Converts to optimal format
- ✅ Serves via CDN
- ✅ Responsive sizing

## API Endpoint

### POST `/api/upload/image`

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KG...",
  "type": "logo|bgLight|bgDark",
  "folder": "ehadir/logo"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://serveproxy.com/?url=https%3A%2F%2Fres.cloudinary.com%2F...",
  "originalUrl": "https://res.cloudinary.com/...",
  "publicId": "ehadir/logo/abc123",
  "width": 500,
  "height": 500,
  "format": "png",
  "size": 45678
}
```

## Troubleshooting

### Error: "Upload gagal"

**Check:**
- ✅ Cloudinary credentials dalam `.env.local` betul
- ✅ File size < 5MB
- ✅ File is valid image format
- ✅ Internet connection stable

### Error: "Failed to upload image"

**Solutions:**
1. Check Cloudinary dashboard - is account active?
2. Verify API Key and Secret
3. Check browser console for detailed error
4. Try smaller file size

### Image not showing after upload

**Check:**
1. Browser console for errors
2. URL in input field is complete
3. Cloudinary URL is accessible
4. ServeProxy is working

### Slow upload

**Tips:**
- Use smaller image files
- Compress images before upload
- Check internet speed
- Try different image format

## Cloudinary Free Tier Limits

| Resource | Limit |
|----------|-------|
| Storage | 25 GB |
| Bandwidth | 25 GB/month |
| Transformations | 25,000/month |
| Images | Unlimited |

**Note**: Free tier is MORE than enough untuk E-HADIR system!

## Security

### Best Practices:
- ✅ Keep API Secret in `.env.local` (not committed)
- ✅ Use serveproxy for URL obfuscation
- ✅ Validate file types on client AND server
- ✅ Limit file sizes
- ✅ Use folders for organization

### Environment Variables:
```bash
# .gitignore already includes .env.local
.env.local
```

## Migration dari Manual URL

### Before (Manual):
```
1. Upload image to hosting
2. Copy URL
3. Paste in admin modal
4. Add serveproxy prefix manually
5. Save
```

### Now (Automatic):
```
1. Click Upload button
2. Select image
3. Save
```

**Time saved**: 90%! 🎉

## Backup & Management

### View Uploaded Images:
1. Login to Cloudinary Console
2. Go to **Media Library**
3. Navigate to `ehadir/` folder

### Delete Old Images:
1. Media Library → Select image
2. Click Delete
3. Or use Cloudinary API

### Get Image Info:
```javascript
// Image URL contains public_id
https://res.cloudinary.com/cloud_name/image/upload/v1234/ehadir/logo/abc123.png
                                                          ↑
                                                     public_id
```

## Alternative: Manual URL Entry

Jika anda masih mahu manual input URL (without upload):

1. Remove `readonly` attribute dari input fields
2. Paste URL directly
3. URL will be used as-is (no serveproxy prefix added automatically)

## Production Deployment

### Vercel/Netlify:

Add environment variables:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Security Note:
- API Secret is server-side only
- Never exposed to client
- Safe to use in serverless functions

## Support

Sebarang issues:
- Check Cloudinary status: [status.cloudinary.com](https://status.cloudinary.com)
- Review docs: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- Contact admin untuk help

---

**Happy Uploading!** 🚀📸
