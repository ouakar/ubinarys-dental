# Rebranding Report: IDURAR to Ubinarys

This report summarizes the full branding transition from "IDURAR" to "Ubinarys" across the application codebase.

## Done / Summary of Changes

### 1. Root Level
- **File Renaming**: `idurar-crm-erp.svg` renamed to `ubinarys-dental.svg`.
- **Documentation**: `README.md`, `INSTALLATION-INSTRUCTIONS.md`, `CONTRIBUTING.md`, and `CODE-OF-CONDUCT.md` have been updated with "Ubinarys" branding and correct URLs/emails.

### 2. Backend
- **Package Manifest**: `backend/package.json` renamed to "ubinarys".
- **Environment & Config**:
  - `backend/.env` updated (DB names and comments).
  - `backend/src/setup/setupConfig.json` migrated keys:
    - `"idurar_app_version"` → `"ubinarys_app_version"`
    - `"idurar_app_unique_id"` → `"ubinarys_app_unique_id"`
- **Templates**: All email templates in `backend/src/emailTemplate/` were updated to reflect the new brand and `ubinarys.com` domain.
- **Controllers & Models**: Global sweep of `backend/src/` to replace brand references in comments, logs, and default string values.

### 3. Frontend
- **Package Manifest**: `frontend/package.json` renamed to "ubinarys".
- **Shell**: `frontend/index.html` updated meta tags (generator, description) and title.
- **Configuration**: `frontend/src/config/serverApiConfig.js` updated to `app.ubinarys.com`.
- **UI Components**:
  - Sidebar, Header, and Footer components in `frontend/src/layout/` were updated to display "Ubinarys".
  - Login page and Dashboard branding refreshed.
- **Global Search & Replace**: Performed a recursive search across `frontend/src/pages/`, `src/components/`, `src/redux/`, etc.

## Replacement Counts (Statistical Approximation)
*Exact instance counts vary by file but typical density was:*
- **Backend Model files**: 1-3 replacements per file (mostly comments).
- **Frontend Pages**: 2-5 replacements per file (UI labels and headers).
- **Setup Config**: Significant key renames.

---

## Remaining Occurrences (Skipped)
Verified with `grep -ri "idurar" .`:
1. **node_modules/**: Skipped intentionally (third-party dependencies).
2. **.git/**: Skipped (history).
3. **package-lock.json**: Skipped (to avoid breaking dependency tree; will be updated on next `npm install`).
4. **Binary files (.png, .jpg)**: Skipped (actual binary content).

## Verification
- Applied `sed` with case preservation (IDURAR -> UBINARYS, idurar -> ubinarys).
- Verified `frontend/index.html` renders correct metadata.
- App still starts normally with rebranded console logs.
