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

### Quick Start (Ubuntu/Linux)
If you are on Ubuntu, you can use the automated setup script:
```bash
bash setup.sh
```

### Manual Setup

#### 1. Prerequisites
- **Node.js 24 LTS** (v24.x required, check with `node --version`)
- **npm 10+** (check with `npm --version`)
- MongoDB Atlas account or local MongoDB

#### 2. Clone the repo
```bash
git clone https://github.com/ouakar/ubinarys-dental.git
cd ubinarys-dental
```

#### 3. Backend setup
```bash
cd app/backend
npm install
```

Create `.env` in `app/backend/`:
```env
DATABASE="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ubinarys?retryWrites=true&w=majority"
JWT_SECRET="your-strong-random-secret-at-least-32-chars"
NODE_ENV="production"
PORT=8888
FRONTEND_URL="http://192.168.1.50"
ALLOWED_ORIGINS="http://192.168.1.50,http://192.168.1.50:3000"
PUBLIC_SERVER_FILE="http://192.168.1.50:8888/"
```

Create `.env` in `app/frontend/`:
```env
VITE_BACKEND_SERVER="http://192.168.1.50:8888/"
VITE_WEBSITE_URL="http://192.168.1.50/"
```

> [!NOTE]
> **LAN Deployment Notice**: The example IP address (`192.168.1.50`) must be replaced with your clinic server's actual static IP address or domain name.

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

## 🚀 Production Deployment & Systemd Service

### Installation & Deployment
```bash
# 1. Install systemd service (runs under dedicated 'ubinarys' user)
sudo ./install-service.sh

# 2. Deploy updates safely (runs npm ci, builds frontend, restarts service)
./deploy.sh
```

### Systemd Troubleshooting & Logging
```bash
# Check service status
systemctl status ubinarys.service

# View recent log output
journalctl -u ubinarys.service -n 100 --no-pager

# Follow live systemd logs
journalctl -u ubinarys.service -f
```

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
