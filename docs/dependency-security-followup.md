# Dependency Security Follow-up & Major Upgrades Plan

This document records the remaining direct and indirect dependencies with security advisories that require breaking/major version upgrades or architecture migrations. These upgrades were deferred to preserve production stability, prevent breaking API/UI changes, and avoid unverified large-scale library replacements.

---

## 1. Remaining Vulnerable Direct Dependencies

### 1. `multer`
- **Location**: `app/backend`
- **Current Version**: `1.4.4`
- **Required Safe Version**: `2.3.0+`
- **Upgrade Type**: **Major** (Breaking API change)
- **Vulnerability**: `dicer` / `busboy` HeaderParser crash (GHSA-wm7h-9275-46v2).
- **Affected Feature**: File uploads (profile photos, clinic logo, treatment attachments).
- **Required Manual Tests**:
  - Test single and multiple image file uploads via reception/admin panels.
  - Verify disk storage path handling and file size limit enforcement.
  - Test multipart form parsing error handling.
- **Why Deferred**: Upgrading from Multer 1.x to 2.x introduces breaking changes in middleware signatures, stream error handling, and storage configuration that require extensive refactoring and manual multi-browser verification.

---

### 2. `nodemailer`
- **Location**: `app/backend`
- **Current Version**: `8.0.4`
- **Required Safe Version**: `10.0.1+`
- **Upgrade Type**: **Major** (Breaking change)
- **Vulnerability**: SMTP command injection / header injection via CRLF (GHSA-vvjj-xcjg-gr5g, GHSA-268h-hp4c-crq3, GHSA-wqvq-jvpq-h66f).
- **Affected Feature**: Email delivery for Invoices, Quotes, and Password Resets.
- **Required Manual Tests**:
  - Configure live SMTP relay or test transport.
  - Dispatch invoice and quote emails with PDF attachments.
  - Test password reset email sending and token link verification.
- **Why Deferred**: Upgrading from Nodemailer 8 to 10 is a major breaking change requiring updates to transport configurations, stream attachments, and testing against live SMTP servers.

---

### 3. `vite` & `esbuild`
- **Location**: `app/frontend`
- **Current Version**: Vite `5.4.21` (esbuild `0.21.5`)
- **Required Safe Version**: Vite `8.2.2+`
- **Upgrade Type**: **Major** (3 major versions jump)
- **Vulnerability**: esbuild development server request reading (GHSA-67mh-4wv8-2f99).
- **Affected Feature**: Frontend build pipeline and local dev server.
- **Required Manual Tests**:
  - Verify full production build output (`npm run build`).
  - Verify CSS processing, asset hashing, and Ant Design theme compilation.
  - Verify development HMR and dev proxy settings.
- **Why Deferred**: Vite 8 is a major release that breaks compatibility with legacy Rollup plugins, PostCSS configurations, and older React toolchains. In production, frontend is served as precompiled static assets (`dist`), eliminating dev-server exposure.

---

### 4. `react-quill` & `quill`
- **Location**: `app/frontend`
- **Current Version**: `react-quill@2.0.0` (quill `1.3.7`)
- **Required Safe Version**: Full package replacement or Quill 2 wrapper
- **Upgrade Type**: **Major** / Library Replacement
- **Vulnerability**: Cross-site Scripting in Quill 1.x (GHSA-4943-9vgg-gr5r).
- **Affected Feature**: Rich text editing in notes and templates.
- **Required Manual Tests**:
  - Test rich text input, formatting, and paste sanitization in dental notes.
  - Verify output rendering across desktop viewports.
- **Why Deferred**: The `react-quill` package is unmaintained and does not support Quill 2. Replacing it with an alternative (e.g. `@tiptap/react` or Slate) requires architectural UI redesign and database content schema migration.

---

### 5. `react-router-dom`
- **Location**: `app/frontend`
- **Current Version**: `6.30.6`
- **Required Safe Version**: `7.18.3+`
- **Upgrade Type**: **Major** (v6 to v7)
- **Vulnerability**: React Router open redirect via backslash in Link (GHSA-wrjc-x8rr-h8h6).
- **Affected Feature**: Client-side navigation, nested routes, and route authentication guards.
- **Required Manual Tests**:
  - Test full page routing across Admin, Clinic, and Authentication pages.
  - Verify route params extraction in ERP modules.
- **Why Deferred**: React Router v7 is a major framework shift (merging Remix into React Router) with breaking changes to route loaders, actions, and configuration.

---

### 6. `@ant-design/pro-layout`
- **Location**: `app/frontend`
- **Current Version**: `7.22.7`
- **Required Safe Version**: Future patch releasing with non-backtracking `path-to-regexp`
- **Upgrade Type**: Upstream dependency
- **Vulnerability**: ReDoS in `path-to-regexp` (GHSA-j3q9-mxjg-w52f).
- **Affected Feature**: Sidebar layout and breadcrumbs navigation.
- **Required Manual Tests**:
  - Verify menu collapse, expand, and navigation transitions.
- **Why Deferred**: Upstream `@ant-design/pro-layout` bundle requires specific regex path parsing; awaiting upstream release without breaking Ant Design v5 compatibility.

---

## 2. Architecture Security Migration (Follow-up)

### Refresh-Token Hashing in Database (`loggedSessions`)
- **Current State**: Plaintext refresh tokens and access tokens are stored in `AdminPassword.loggedSessions` array. Tokens are generated using high-entropy secret signing and rotated upon use, and invalidated on logout or password change.
- **Recommended Follow-up**:
  1. Hash refresh tokens with SHA-256 before inserting into `loggedSessions`.
  2. Implement a database migration script for existing active user sessions.
  3. Validate incoming refresh tokens by verifying JWT signature, then computing SHA-256 hash and checking membership in `loggedSessions`.
