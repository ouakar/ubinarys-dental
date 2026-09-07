# ⚠️ SECURITY NOTICE — IMMEDIATE ACTION REQUIRED

## Exposed Credentials Alert

During a comprehensive security audit of this repository, hardcoded MongoDB Atlas database credentials were found committed in source code (specifically in `app/backend/src/setup/seedTreatments.js` and local `.env` files).

> [!CAUTION]
> **Deleting secrets from source code DOES NOT invalidate existing database credentials!**
> Credentials exposed in git repositories must be assumed compromised and must be revoked immediately at the provider level.

---

## Required Remediation Steps

### 1. Rotate Database Credentials in MongoDB Atlas
1. Log into [MongoDB Atlas](https://cloud.mongodb.com).
2. Navigate to **Database Access** under **Security**.
3. Locate the user (e.g. `wisslan2013_db_user`) and click **Edit**.
4. Select **Autogenerate Very Strong Password** or set a new secret password.
5. Click **Update User**.
6. Alternatively, delete the compromised user and create a fresh database user with least privilege access.

### 2. Update Production Environment Variables
1. Open your server's `app/backend/.env` file.
2. Update the `DATABASE` environment variable with the new MongoDB Atlas connection string:
   ```env
   DATABASE="mongodb+srv://NEW_USER:NEW_PASSWORD@ubinarys.yf4wdly.mongodb.net/ubinarys?retryWrites=true&w=majority"
   ```
3. Restart the backend service:
   ```bash
   sudo systemctl restart ubinarys.service
   ```

### 3. Rotate JWT Secrets
If the default `JWT_SECRET` was used in production, generate a new 64-character random string and update `JWT_SECRET` in `app/backend/.env`.

---

## Security Policies Enforced in Code
- Hardcoded MongoDB URIs have been removed from all seed and utility scripts.
- The `DATABASE` environment variable is now strictly required for application startup and seed operations.
- Destructive reset commands (`npm run db:reset-dangerous`) are guarded against production execution and require explicit environment variable confirmation (`CONFIRM_DATABASE_RESET=YES_DELETE_CONFIGURATION`).
