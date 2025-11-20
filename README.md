# 🎯 E-HADIR Majikan - Digital Attendance System

Sistem kehadiran digital untuk Majikan menggunakan Google Sheets API dan Service Account.

## 🚀 Features

- ✅ Real-time attendance tracking
- ✅ Google Sheets integration via Service Account
- ✅ Staff registration for new users
- ✅ Admin panel for settings
- ✅ Light/Dark mode theme
- ✅ Custom background support
- ✅ Responsive glassmorphism UI
- ✅ No Apps Script needed!

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- Google Service Account credentials
- Google Spreadsheet ID

## 🔧 Installation

### 1. Clone repository

```bash
git clone <your-repo-url>
cd e-hadir-Majikan
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env.local` file:

```env
# Google Service Account
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=
GOOGLE_SHEET_ID=

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=
```

### 4. Share Google Spreadsheet

Share your spreadsheet with the service account email:

```
suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com
```

Give it **Editor** permission!

### 5. Run development server

```bash
npm run dev
```

Open http://localhost:3000

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. New site from Git
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Deploy!

## 📁 File Structure

```
e-hadir-Majikan/
├── public/
│   └── index.html                 # Main HTML file
├── pages/
│   └── api/
│       ├── meeting-info.js        # GET meeting info
│       ├── check-staff.js         # POST check staff
│       ├── attendance/
│       │   └── record.js          # POST record attendance
│       ├── staff/
│       │   └── add.js             # POST add new staff
│       └── settings/
│           └── update.js          # POST update settings
├── .env.local                     # Environment variables (gitignored)
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## 🔑 Environment Variables

| Variable                     | Description                 | Required |
| ---------------------------- | --------------------------- | -------- |
| `GOOGLE_PRIVATE_KEY`         | Service Account private key | ✅ Yes   |
| `GOOGLE_CLIENT_EMAIL`        | Service Account email       | ✅ Yes   |
| `GOOGLE_SHEET_ID`            | Google Spreadsheet ID       | ✅ Yes   |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin panel password        | ✅ Yes   |

## 📊 Google Sheets Structure

### Sheet: DATA STAF

| A (ID) | B (Nama) | C (Jawatan) | D (Lokasi)  | E   | F (Status) |
| ------ | -------- | ----------- | ----------- | --- | ---------- |
| 1234   | AHMAD    | PEGAWAI     | IBU PEJABAT |     | WAKIL      |

### Sheet: KEHADIRAN

| A (Timestamp) | B (ID) | C (Nama) | D (Status) |
| ------------- | ------ | -------- | ---------- |
| 20/11/2025... | 1234   | AHMAD    | HADIR      |

### Sheet: FX (Settings)

| K1 (Title) | K2 (Date)  | K3 (Location)   | K4 (Logo)   | K5 (Status) | K6 (Background) |
| ---------- | ---------- | --------------- | ----------- | ----------- | --------------- |
| MESYUARAT  | 20/11/2025 | BILIK MESYUARAT | https://... | on          | https://...     |

## 🔐 Security

- Private key stored in environment variables (server-side only)
- Service Account authentication
- No credentials exposed to client
- HTTPS enforced by Vercel/Netlify

## 🐛 Troubleshooting

### Error: "invalid_grant"

**Solution:** Check if GOOGLE_PRIVATE_KEY includes `\n` for newlines

### Error: "The caller does not have permission"

**Solution:** Share spreadsheet with service account email (Editor access)

### Error: "Sheet not found"

**Solution:** Check sheet names match exactly: "DATA STAF", "KEHADIRAN", "FX"

## 📞 Support

For issues or questions, contact Majikan IT Department.

## 📄 License

ISC License - Majikan

---

**Made with ❤️ by Majikan IT Team**
