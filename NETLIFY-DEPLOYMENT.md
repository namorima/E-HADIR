# Netlify Deployment Guide

## Environment Variables Setup

Untuk deploy E-HADIR ke Netlify, anda perlu set environment variables di Netlify dashboard.

### Step-by-Step Guide

1. **Login ke Netlify Dashboard**
   - Go to: https://app.netlify.com/
   - Pilih site anda

2. **Navigate to Environment Variables**
   - Site settings → Environment variables
   - Atau: Build & deploy → Environment → Environment variables

3. **Add Variables (WAJIB)**

#### Google Sheets API
```
GOOGLE_CLIENT_EMAIL
Value: suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com
```

```
GOOGLE_SHEET_ID
Value: 1sNxZCmzulKpv8BQu0-6P2mC1wX33RZfCYRGSV4h6A0U
```

```
GOOGLE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwRr7wLf5L1+cj
[FULL PRIVATE KEY HERE - WITH ACTUAL NEWLINES]
-----END PRIVATE KEY-----

⚠️ PENTING:
- Paste FULL private key WITH actual newlines (press Enter untuk newline)
- JANGAN guna \n (escaped) - kena actual Enter/newline
- Netlify akan auto-handle encoding
```

#### Neon Database
```
DATABASE_URL
Value: postgresql://neondb_owner:npg_InXQ1qWMvmL7@ep-floral-truth-a1ll6ovl-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### Cloudinary
```
CLOUDINARY_CLOUD_NAME
Value: ehadir
```

```
CLOUDINARY_API_KEY
Value: 947836656793874
```

```
CLOUDINARY_API_SECRET
Value: 58RvkXH6VcDI9frcCoKz74yX_OQ
```

#### Admin Password
```
NEXT_PUBLIC_ADMIN_PASSWORD
Value: onearekeamall
```

### 4. **Set Scopes**
Untuk setiap variable:
- ✅ Tick **"Production"**
- ✅ Tick **"Deploy Previews"** (optional)
- ✅ Tick **"Branch deploys"** (optional)

### 5. **Deploy**
Lepas set semua variables:
- Deploys → Trigger deploy → **Clear cache and deploy site**

---

## Troubleshooting

### Error: "No database connection string"

**Penyebab:**
- `DATABASE_URL` tidak set di Netlify
- Atau ada typo dalam variable name

**Penyelesaian:**
1. Check variable name: Mesti `DATABASE_URL` (UPPERCASE, dengan underscore)
2. Check value: Kena ada full connection string dengan `postgresql://`
3. Redeploy site selepas set variable

### Error: "Unknown API key" (Cloudinary)

**Penyebab:**
- Cloudinary variables tidak set
- Atau nilai salah

**Penyelesaian:**
1. Verify semua 3 Cloudinary variables set dengan betul
2. Login ke Cloudinary dashboard verify API key & secret
3. Redeploy

### Error: "Invalid private key" (Google Sheets)

**Penyebab:**
- Private key format salah
- Ada extra spaces atau characters

**Penyelesaian - Format Private Key dengan Betul:**

**Method 1: Copy from .env.local**
1. Buka `.env.local`
2. Copy FULL value dari `GOOGLE_PRIVATE_KEY=`
3. Replace semua `\n` dengan actual newline (Enter)
4. Paste ke Netlify

**Method 2: Get dari Google Cloud Console**
1. Go to: https://console.cloud.google.com/
2. IAM & Admin → Service Accounts
3. Click service account email
4. Keys → Add Key → Create new key (JSON)
5. Download JSON file
6. Extract `private_key` value
7. Paste ke Netlify (it already has actual newlines)

**Correct Format Example:**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwRr7wLf5L1+cj
e5N4Y9K... [many lines]
...3mJ2kQ==
-----END PRIVATE KEY-----
```

---

## Verify Deployment

Selepas deploy, test:

1. **Visit site URL** (e.g., https://your-site.netlify.app)
2. **Check loading:**
   - Logo muncul?
   - Meeting info loaded?
   - Background image apply?

3. **Test Admin:**
   - Login dengan ID: `0000`
   - Password: `onearekeamall`
   - Settings modal buka?
   - Image upload works?

4. **Check Netlify Function Logs:**
   - Netlify Dashboard → Functions
   - Click on function (e.g., `meeting-info`)
   - Check logs untuk errors

---

## Build Settings (Verify)

**Build command:**
```bash
npm run build
```

**Publish directory:**
```
.next
```

**Functions directory:**
```
pages/api
```

Next.js should auto-detect these settings.

---

## Important Notes

⚠️ **JANGAN commit `.env.local` ke Git/GitHub!**
- File ini ada sensitive credentials
- Sudah ada dalam `.gitignore`

✅ **Verify `.gitignore` contains:**
```
.env*.local
.env
```

🔒 **Security Best Practice:**
- Set sensitive variables sebagai "Secret" di Netlify (lock icon)
- Regularly rotate API keys & secrets
- Monitor Netlify function logs untuk unauthorized access

---

## Common Issues

### Issue: Build succeeds but site shows errors

**Check:**
1. Netlify Function logs untuk runtime errors
2. Browser Console untuk client-side errors
3. Verify ALL environment variables set correctly

### Issue: "Module not found" errors

**Solution:**
```bash
# Ensure all dependencies in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue: Database connection timeout

**Check:**
1. Neon database masih active (free tier ada limits)
2. DATABASE_URL betul (check pooler URL)
3. SSL settings: `sslmode=require`

---

## Support

Jika masih ada masalah, check:
- Netlify Deploy logs: Deploys → [Latest deploy] → Deploy log
- Netlify Function logs: Functions → [Function name] → Logs
- Browser DevTools Console (F12)

Copy error message untuk troubleshoot with more details.
