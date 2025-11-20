# 📁 COMPLETE FILE STRUCTURE - NETLIFY/VERCEL DEPLOYMENT

## 🎯 Overview

Untuk host di **Netlify** atau **Vercel**, anda perlu structure project sebagai **Next.js application**.

---

## 📂 Complete File Structure

```
e-hadir/                                    # Root folder
│
├── pages/                                  # Next.js pages
│   ├── index.js                           # Main page (akan render HTML)
│   ├── _app.js                            # App wrapper
│   ├── _document.js                       # HTML document
│   │
│   └── api/                               # API Routes (serverless functions)
│       ├── meeting-info.js                # GET - Fetch meeting info
│       ├── check-staff.js                 # POST - Check staff ID
│       │
│       ├── attendance/
│       │   └── record.js                  # POST - Record attendance
│       │
│       ├── staff/
│       │   └── add.js                     # POST - Add new staff
│       │
│       └── settings/
│           └── update.js                  # POST - Update FX settings
│
├── public/                                 # Static files
│   ├── favicon.ico                        # Site icon
│   └── logo3.png                          # Your logo (optional)
│
├── components/                             # React components (optional)
│   └── AttendanceForm.js                  # Form component
│
├── styles/                                 # CSS files
│   └── globals.css                        # Global styles
│
├── lib/                                    # Helper functions
│   └── sheets.js                          # Google Sheets helper
│
├── .env.local                             # Environment variables (gitignore!)
├── .gitignore                             # Git ignore file
├── next.config.js                         # Next.js configuration
├── package.json                           # Dependencies
├── package-lock.json                      # Lock file
└── README.md                              # Documentation
```

---

## 📝 METHOD 1: Simple HTML Approach (Recommended!)

Cara paling mudah - guna HTML existing anda terus!

### File Structure (Simplified):

```
e-hadir/
├── public/
│   └── index.html                         # Your existing HTML file!
│
├── pages/
│   └── api/                               # API routes only
│       ├── meeting-info.js
│       ├── check-staff.js
│       ├── attendance/
│       │   └── record.js
│       ├── staff/
│       │   └── add.js
│       └── settings/
│           └── update.js
│
├── .env.local
├── .gitignore
├── next.config.js
└── package.json
```

### Step 1: Create next.config.js

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },
};
```

### Step 2: Update your index.html

Copy your existing `index.html` to `public/index.html` dan update:

**Replace `google.script.run` calls with `fetch` calls:**

```javascript
// Before (Google Apps Script)
google.script.run
  .withSuccessHandler(handleStaffInfo)
  .semakID(staffId);

// After (API Route)
fetch('/api/check-staff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idStaf: staffId })
})
  .then(res => res.json())
  .then(handleStaffInfo)
  .catch(handleError);
```

### Step 3: Remove scriptlets (<?= ?>)

**Before:**
```html
<img src="<?= logoUrl ?>" alt="Logo">
<h1><?= meetingTitle ?></h1>
```

**After:**
```html
<img id="headerLogo" src="" alt="Logo">
<h1 id="meetingTitle"></h1>

<script>
// Fetch meeting info on page load
fetch('/api/meeting-info')
  .then(res => res.json())
  .then(data => {
    document.getElementById('headerLogo').src = data.data.logo;
    document.getElementById('meetingTitle').textContent = data.data.title;
    // Set other fields...
  });
</script>
```

---

## 📝 METHOD 2: Full Next.js (Advanced)

Convert HTML to React components.

### pages/_app.js
```javascript
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

### pages/_document.js
```javascript
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ms">
      <Head>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### pages/index.js
```javascript
import { useState, useEffect } from 'react';

export default function Home() {
  const [meetingInfo, setMeetingInfo] = useState(null);

  useEffect(() => {
    fetch('/api/meeting-info')
      .then(res => res.json())
      .then(data => setMeetingInfo(data.data));
  }, []);

  // Your component JSX here
  return (
    <div>
      {/* Your attendance form */}
    </div>
  );
}
```

---

## 📋 Required Files (Minimum)

### 1. package.json
```json
{
  "name": "e-hadir",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next export"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "googleapis": "^128.0.0"
  }
}
```

### 2. .gitignore
```
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/
build/
dist/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### 3. .env.local
```env
# Service Account
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com
GOOGLE_SHEET_ID=1sNxZCmzulKpv8BQu0-6P2mC1wX33RZfCYRGSV4h6A0U
NEXT_PUBLIC_ADMIN_PASSWORD=onearekeamall
```

### 4. next.config.js
```javascript
module.exports = {
  reactStrictMode: true,
  // For static export (optional)
  // output: 'export',
  
  // For Netlify/Vercel API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};
```

---

## 🚀 Deployment Steps

### For NETLIFY:

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/e-hadir.git
git push -u origin main
```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/
   - "New site from Git"
   - Choose repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

3. **Add Environment Variables**
   - Site settings → Environment variables
   - Add all from `.env.local`

4. **Deploy!**

### For VERCEL:

1. **Push to GitHub** (same as above)

2. **Connect to Vercel**
   - Go to https://vercel.com/
   - "New Project"
   - Import your repository
   - Framework: Next.js (auto-detected)

3. **Add Environment Variables**
   - During setup or Settings → Environment Variables
   - Add all from `.env.local`

4. **Deploy!**

---

## 📊 Comparison: Netlify vs Vercel

| Feature | Netlify | Vercel |
|---------|---------|--------|
| **Next.js Support** | ✅ Good | ✅ Excellent (made by Vercel) |
| **Build Speed** | Fast | Faster |
| **Free Tier** | 100GB bandwidth | 100GB bandwidth |
| **Serverless Functions** | 125k/month | 100k/month |
| **Custom Domain** | ✅ Free | ✅ Free |
| **Best For** | General projects | Next.js projects |

**Recommendation:** Use **Vercel** for Next.js - it's optimized for it!

---

## 🔧 Testing Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000

# Build for production
npm run build

# Start production server
npm start
```

---

## 📝 Migration Checklist

- [ ] Create project folder
- [ ] Copy index.html to public/ (Method 1) or convert to React (Method 2)
- [ ] Create all API route files in pages/api/
- [ ] Create package.json
- [ ] Create .env.local with credentials
- [ ] Create .gitignore
- [ ] Create next.config.js
- [ ] Replace google.script.run with fetch() calls
- [ ] Replace scriptlets (<?= ?>) with JavaScript
- [ ] Test locally (npm run dev)
- [ ] Push to GitHub
- [ ] Deploy to Netlify/Vercel
- [ ] Add environment variables
- [ ] Test production deployment
- [ ] Update DNS if using custom domain

---

## 🎯 Recommended: Method 1 (Simple HTML)

**Kelebihan:**
✅ Minimal changes to existing code
✅ Keep your HTML as-is
✅ Just replace API calls
✅ Faster migration
✅ Easier to maintain

**Steps:**
1. Copy index.html to public/
2. Create API routes
3. Replace google.script.run with fetch
4. Deploy!

---

## 💡 Example: Updated index.html

See the complete updated index.html in the next file I'll create!

Would you like me to:
1. ✅ Create updated index.html with fetch calls?
2. ✅ Create all required Next.js files?
3. ✅ Create deployment scripts?

Let me know! 🚀
