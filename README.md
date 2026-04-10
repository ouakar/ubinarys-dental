# Ubinarys Dental Cloud SaaS

<p align="center">
  <img src="app/frontend/src/style/images/logo-with-text.png" alt="Ubinarys Logo" width="300"/>
</p>

<p align="center">
  <b>Cloud-based dental practice management software for Moroccan clinics</b><br/>
  Built on IDURAR ERP/CRM (MERN stack) • Fully in French • MAD currency enforced
</p>

---

## 🦷 About

**Ubinarys Dental** is a complete dental practice management platform designed for Moroccan dental clinics. It covers patient management, appointment scheduling, treatment cataloging, invoicing in MAD (Moroccan Dirham), and detailed financial reporting.

### Key Features
- 👥 **Patient Management** — full CRM with medical history, allergies, last visit & next appointment tracking
- 📅 **Appointment Calendar** — interactive calendar view + reception daily dashboard
- 🦷 **Treatment Catalog** — 14 pre-seeded Moroccan dental treatments (Détartrage, Couronne, Implant, etc.)
- 🧾 **Invoicing** — sequential numbered invoices (YYYY/N), PDF generation, MAD currency locked
- 💬 **Quotes/Proformas** — full CRUD, convert to invoice
- 💳 **Payments** — payment tracking with modes
- 📊 **Reports** — daily cash report & monthly financial overview grouped by dentist
- 🇫🇷 **Full French UI** — complete localization (fr_fr) with French status labels
- 🔒 **MAD enforced** — currency hardcoded at model + UI level

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Ant Design 5, Vite, Redux Toolkit |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB Atlas |
| PDF | node-html-pdf / puppeteer |
| Auth | JWT |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB 6)

### 1. Clone the repo
```bash
git clone https://github.com/ouakar/ubinarys-dental.git
cd ubinarys-dental
```

### 2. Backend setup
```bash
cd app/backend
npm install
```

Create `.variables.env` in `app/backend/`:
```env
DATABASE="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=ubinarys"
JWT_SECRET="your-strong-random-secret"
NODE_ENV="development"
PUBLIC_SERVER_FILE="http://localhost:8888/"
OPENSSL_CONF="/dev/null"
```

### 3. Initialize database (first time only)
```bash
node src/setup/setup.js
node src/setup/seedTreatments.js
```

### 4. Start backend
```bash
npm run dev
# → Express running on PORT: 8888
```

### 5. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:3000
```

### 6. Default login
- Email: `admin@demo.com`
- Password: `admin123`

---

## 📁 Project Structure

```
ubinarys-dental/
├── app/
│   ├── backend/               # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/   # CRUD + custom (invoice, appointment, reports)
│   │   │   ├── models/        # Mongoose schemas (Patient, Invoice, Appointment...)
│   │   │   ├── routes/        # Express routes
│   │   │   └── setup/         # Seed scripts
│   └── frontend/              # React + Ant Design SPA
│       └── src/
│           ├── pages/         # Route-level pages
│           ├── modules/       # Feature modules
│           ├── forms/         # Shared forms
│           └── locale/        # French translations (fr_fr.js)
└── docs/                      # Change log, roadmap, documentation
```

---

## 📝 Change Log

See [docs/change-log.md](docs/change-log.md) for full history.

---

## 📄 License

Private — Ubinarys IT Solutions. All rights reserved.
