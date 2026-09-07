# Ubinarys Dental - System Maintenance & Operations Manual

This document provides system administrators and DevOps engineers with complete operational instructions for managing, maintaining, backing up, and deploying the **Ubinarys Dental** clinic management system in production environments.

---

## 1. System & Environment Requirements

- **Node.js**: `v24.x` (LTS) required across all environments.
- **Node Version Management**: `.nvmrc` and `.node-version` files specify `24`. Use `nvm use` or `fnm use` before operations.
- **MongoDB**: Community Edition or MongoDB Atlas (v6.0+ recommended).
- **Process Manager**: systemd (Linux system service running under dedicated `ubinarys` service user).
- **PDF Engine Dependencies**: `puppeteer` requires standard headless Chromium libraries (`libnss3`, `libatk1.0-0`, `libgbm1`, `libasound2`, `libx11-xcb1`, etc.).

---

## 2. Configuration & Environment Variables

Production runtime environment parameters are stored securely at `/etc/ubinarys/ubinarys-backend.env` with strict permissions (`600`, owned by `ubinarys:ubinarys`).

### Required Configuration Variables
```ini
# Node Environment
NODE_ENV=production
PORT=8888

# Security & Secrets
JWT_SECRET=your_high_entropy_32char_minimum_secret_here

# Database Connectivity
DATABASE=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/ubinarys-dental?retryWrites=true&wbb=majority

# Network & CORS Settings
CORS_ORIGIN=https://clinic.ubinarys.com,http://192.168.1.50:8888

# Puppeteer PDF Generator Path (optional if using system-installed Chromium)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

> **WARNING**: Never commit real database connection strings or JWT secrets into version control. Ensure all environment secrets are rotated periodically according to `SECURITY-NOTICE.md`.

---

## 3. Service Management (systemd)

The backend service is managed by systemd as `ubinarys-backend.service`.

### Standard Commands

- **Check Service Status**:
  ```bash
  sudo systemctl status ubinarys-backend
  ```

- **Start Service**:
  ```bash
  sudo systemctl start ubinarys-backend
  ```

- **Stop Service**:
  ```bash
  sudo systemctl stop ubinarys-backend
  ```

- **Restart Service**:
  ```bash
  sudo systemctl restart ubinarys-backend
  ```

- **Enable Auto-start on System Boot**:
  ```bash
  sudo systemctl enable ubinarys-backend
  ```

### Inspecting Service Logs

Logs are written to systemd journald without exposing authorization tokens or passwords:

- **Tail live log output**:
  ```bash
  sudo journalctl -u ubinarys-backend -f
  ```

- **View recent logs with timestamp**:
  ```bash
  sudo journalctl -u ubinarys-backend -n 100 --no-pager
  ```

---

## 4. Health Check Monitoring

Ubinarys Dental provides two unauthenticated health monitoring endpoints for systemd, load balancers, and uptime probes:

| Endpoint | HTTP Status | Description |
|---|---|---|
| `GET /health/live` | `200 OK` | Liveness check; indicates service process is running. |
| `GET /health/ready` | `200 OK` / `503 Service Unavailable` | Readiness check; returns 200 when MongoDB connection is connected (`readyState === 1`), 503 otherwise. |

### Verification Examples

```bash
# Liveness
curl -i http://localhost:8888/health/live

# Readiness
curl -i http://localhost:8888/health/ready
```

---

## 5. Deployment Procedure

Deploying updates to a server is fully automated via `./deploy.sh`.

### Standard Deployment Workflow

1. Navigate to project root:
   ```bash
   cd /opt/ubinarys-dental
   ```

2. Fetch latest code updates:
   ```bash
   git pull origin fix/production-stability-security
   ```

3. Execute the zero-downtime deployment script:
   ```bash
   ./deploy.sh
   ```

### What `deploy.sh` Does:
1. Validates Node 24 runtime environment.
2. Installs root, backend, and frontend dependencies (`npm ci`).
3. Runs the test suite (`npm run check`).
4. Compiles optimized production frontend build (`dist`).
5. Restarts `ubinarys-backend` systemd service.
6. Verifies process health via `GET /health/ready`.

---

## 6. Database Maintenance & Disaster Recovery

### Creating Database Backups (`mongodump`)

Run regular automated database dumps to prevent data loss:

```bash
# Backup production database
mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/ubinarys-dental" \
          --out="/var/backups/ubinarys/dump-$(date +%Y%m%d_%H%M%S)"
```

### Restoring Database (`mongorestore`)

To restore from a snapshot:

```bash
mongorestore --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/ubinarys-dental" \
             --drop \
             "/var/backups/ubinarys/dump-20260907_120000/ubinarys-dental"
```

### Database Reset Protection (`db:reset-dangerous`)

Database resets are explicitly protected against accidental execution in production.

- Resets are blocked if `NODE_ENV=production`.
- Execution requires explicit confirmation flag:
  ```bash
  CONFIRM_DATABASE_RESET=YES_DELETE_CONFIGURATION npm run db:reset-dangerous
  ```

> **NEVER** run database reset scripts on live client data.

---

## 7. Testing & Quality Assurance

Before pushing changes to repository branches or deploying to production, run the full validation suite:

```bash
npm run check
```

This single command executes:
1. Node version check (`>=24`).
2. Backend API unit & integration tests (`startup`, `health`, `cors`, `pdf`).
3. Frontend state persistence & configuration tests.
4. ESLint code standard validations across codebases.
5. Vite production bundle compilation check.

---

## 8. Troubleshooting Guide

| Issue | Potential Cause | Remediation |
|---|---|---|
| Service crashes on launch with code 1 | Missing environment variables | Check `/etc/ubinarys/ubinarys-backend.env` for `DATABASE` and `JWT_SECRET`. |
| `/health/ready` returns 503 | MongoDB network disconnect or invalid credentials | Verify MongoDB connectivity, host address, and Atlas IP whitelist. |
| PDF generation fails | Missing Chromium dependencies for Puppeteer | Install required Linux libraries or set `PUPPETEER_EXECUTABLE_PATH`. |
| Frontend API CORS error | Request origin not listed in CORS configuration | Add frontend host/IP to `CORS_ORIGIN` in `/etc/ubinarys/ubinarys-backend.env`. |
