# 🚀 QUICK START GUIDE - E-HADIR FELCRA

## ✅ Complete Package Contents:

### 📄 **Core Files:**

1. **index.html** - Updated dengan fetch API calls (NO google.script.run!)
2. **package.json** - Dependencies configuration
3. **next.config.js** - Next.js configuration
4. **gitignore** - Git ignore template (rename to .gitignore)
5. **README.md** - Full documentation
6. **deploy.sh** - Automated deployment script

### 🔌 **API Routes (Already provided earlier):**

7. **api-service-record.js** → `pages/api/attendance/record.js`
8. **api-service-add-staff.js** → `pages/api/staff/add.js`
9. **api-service-update-settings.js** → `pages/api/settings/update.js`
10. **api-meeting-info.js** → `pages/api/meeting-info.js`
11. **api-check-staff.js** → `pages/api/check-staff.js`

---

## 🎯 30-Second Quick Start:

```bash


# 2. Create folder structure
mkdir -p pages/api/{attendance,staff,settings}
mkdir public

# 3. Copy files to correct locations:
# - index.html → public/index.html
# - package.json → package.json
# - next.config.js → next.config.js
# - gitignore → .gitignore
# - API files → pages/api/ (correct folders)

# 4. Create .env.local
cat > .env.local << 'EOF'
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com
GOOGLE_SHEET_ID=1sNxZCmzulKpv8BQu0-6P2mC1wX33RZfCYRGSV4h6A0U
NEXT_PUBLIC_ADMIN_PASSWORD=onearekeamall
EOF

# 5. Install & run
npm install
npm run dev
```

---

## 📂 Final Folder Structure:

```
e-hadir-felcra/
├── public/
│   └── index.html                          ⭐ UPDATED HTML
│
├── pages/
│   └── api/
│       ├── meeting-info.js                 ⭐ GET meeting info
│       ├── check-staff.js                  ⭐ POST check staff
│       ├── attendance/
│       │   └── record.js                   ⭐ POST record
│       ├── staff/
│       │   └── add.js                      ⭐ POST add staff
│       └── settings/
│           └── update.js                   ⭐ POST update
│
├── .env.local                              ⭐ CREDENTIALS
├── .gitignore                              ⭐ GIT IGNORE
├── next.config.js                          ⭐ CONFIG
├── package.json                            ⭐ DEPENDENCIES
├── README.md                               📖 DOCS
└── deploy.sh                               🚀 DEPLOY SCRIPT
```

---

## 🔑 What Changed in index.html?

### ❌ **REMOVED (Old Apps Script):**

```javascript
google.script.run.withSuccessHandler(handleStaffInfo).semakID(staffId);
```

### ✅ **REPLACED WITH (New Fetch API):**

```javascript
const response = await fetch("/api/check-staff", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idStaf: staffId }),
});
const data = await response.json();
handleStaffInfo(data);
```

### 📝 **All Replacements Made:**

1. ✅ `semakID()` → `/api/check-staff`
2. ✅ `rekodKehadiran()` → `/api/attendance/record`
3. ✅ `tambahStaf()` → `/api/staff/add`
4. ✅ `getFXSettings()` → `/api/meeting-info`
5. ✅ `updateFXSettings()` → `/api/settings/update`
6. ✅ Removed all `<?= ?>` scriptlets
7. ✅ Load meeting info on page load via API

---

## 🚀 Deploy Options:

### **Option 1: Vercel (Easiest)**

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Deploy
npx vercel

# Add env vars in Vercel dashboard
# Done!
```

### **Option 2: Netlify**

```bash
# Push to GitHub
git push

# Connect repo in Netlify
# Build command: npm run build
# Publish directory: .next

# Add env vars in Netlify dashboard
# Done!
```

### **Option 3: Automated Script**

```bash
chmod +x deploy.sh
./deploy.sh
# Follow the prompts!
```

---

## ✅ Pre-Deployment Checklist:

- [ ] **Share Google Spreadsheet** with service account email
- [ ] **Update .env.local** with real credentials
- [ ] **Test locally:** `npm run dev`
- [ ] **Build successfully:** `npm run build`
- [ ] **Push to GitHub**
- [ ] **Deploy to hosting**
- [ ] **Add environment variables** in hosting dashboard
- [ ] **Test live deployment**

---

## 🎯 Environment Variables (For Hosting Dashboard):

```
GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL = suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com
GOOGLE_SHEET_ID = 1sNxZCmzulKpv8BQu0-6P2mC1wX33RZfCYRGSV4h6A0U
NEXT_PUBLIC_ADMIN_PASSWORD = onearekeamall
```

**CRITICAL:** Make sure `GOOGLE_PRIVATE_KEY` includes the `\n` characters!

---

## 🔍 Testing:

### Local Test:

```bash
# Start server
npm run dev

# Open browser
http://localhost:3000

# Try:
1. Enter staff ID
2. Record attendance
3. Admin access (0000)
```

### API Test:

```bash
# Test check staff
curl -X POST http://localhost:3000/api/check-staff \
  -H "Content-Type: application/json" \
  -d '{"idStaf":"1234"}'

# Should return staff info or not_found
```

---

## 🆘 Troubleshooting:

| Problem            | Solution                         |
| ------------------ | -------------------------------- |
| Build fails        | Run `npm install` again          |
| API errors         | Check .env.local variables       |
| Spreadsheet access | Share with service account email |
| Invalid grant      | Check GOOGLE_PRIVATE_KEY format  |
| 404 on APIs        | Check file paths in pages/api/   |

---

## 📞 Support:

Refer to:

1. **README.md** - Full documentation
2. **SERVICE-ACCOUNT-SETUP.md** - Service Account guide
3. **FILE-STRUCTURE-GUIDE.md** - Complete file structure

---

## 🎉 YOU'RE READY!

Everything is set up! Just:

1. Copy files to correct folders
2. Update .env.local
3. Deploy!

**Good luck Akmal! 🚀✨**
