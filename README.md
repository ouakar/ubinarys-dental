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

### Local development only

For local development with MongoDB running locally on Ubuntu:

```env
DATABASE="mongodb://127.0.0.1:27017/ubinarys?directConnection=true&serverSelectionTimeoutMS=10000"
JWT_SECRET="CHANGE_ME_TO_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
NODE_ENV="development"
PORT="8888"
FRONTEND_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
PUBLIC_SERVER_FILE="http://localhost:8888/"
ENABLE_DEFAULT_ADMIN="true"
```

Initialize development data and default administrator:
```bash
npm run setup:dev
```

**Development-only default administrator credentials:**
- **Email:** `admin@demo.com`
- **Password:** `Admin@2026!Local`

> [!CAUTION]
> These credentials are valid **only** when `NODE_ENV=development` and `ENABLE_DEFAULT_ADMIN=true`. They are strictly rejected in production environments.

### LAN Access & Multi-Computer Setup

To allow other computers on the clinic's local network (LAN) to access the application, configure your `.env` files with your Ubuntu server's static IP:

#### Backend (`app/backend/.env`):
```env
FRONTEND_URL="http://192.168.11.117:3000"
ALLOWED_ORIGINS="http://192.168.11.117:3000,http://localhost:3000"
PUBLIC_SERVER_FILE="http://192.168.11.117:8888/"
```

#### Frontend (`app/frontend/.env`):
```env
VITE_BACKEND_SERVER="http://192.168.11.117:8888/"
VITE_WEBSITE_URL="http://192.168.11.117:3000/"
```

> [!NOTE]
> `192.168.11.117` is an example and must match the Ubuntu server’s static IP on your network.

#### Firewall Configuration (UFW)
During development or LAN testing, allow incoming traffic on ports 3000 and 8888:
```bash
sudo ufw allow 3000/tcp comment "Ubinarys Dental Frontend"
sudo ufw allow 8888/tcp comment "Ubinarys Dental Backend API"
sudo ufw reload
```

#### Concurrent Desktop Access
The system supports simultaneous logins from multiple desktop computers (e.g., reception desk and doctor's dental chair). Logging in from a second desktop creates an isolated session without terminating the existing session.

### Initial Administrator Account (Production)
In production, set `NODE_ENV=production` and specify strong credentials:
- `INITIAL_ADMIN_EMAIL`: Your initial admin email address
- `INITIAL_ADMIN_PASSWORD`: High-entropy password (min 12 characters, uppercase, lowercase, number, special char)
- `INITIAL_ADMIN_NAME`: Administrator first name
- `INITIAL_ADMIN_SURNAME`: Administrator last name

Run initial setup:
```bash
cd app/backend && npm run setup
```

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
