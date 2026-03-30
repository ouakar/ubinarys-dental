# IDURAR to Dental SaaS Transformation Roadmap

## Overview
This roadmap outlines the plan to transform the existing IDURAR ERP/CRM (MERN stack) into a specialized cloud dental management SaaS tailored for Moroccan dental clinics.

## Tech Stack Summary
- **Backend:** Node.js, Express.js, Mongoose (MongoDB)
- **Frontend:** React (Vite), Redux Toolkit, Ant Design, React Router
- **Additional:** AI skills folder (`skills/forgewright`)

## Current Main Modules
- **App Models:** Client/Customer, Invoice, Payment, Quote, Taxes
- **Core Models:** Admin, Settings, Upload

---

## Phased Transformation Plan

### Phase 1: Foundation & Terminology Adaptation (Customers → Patients)
**Objective:** Replace all CRM-centric terminology with healthcare-centric terminology.
- **Backend:** 
  - Rename the `Client` model to `Patient`.
  - Update all references in relationships (e.g., in `Invoice.js` and `Quote.js`, change `client` ref to `patient`).
  - Update API routes from `/api/client` to `/api/patient`.
- **Frontend:** 
  - Rename `Customer` related pages, forms, and modules to `Patient` (e.g., `CustomerForm.jsx` → `PatientForm.jsx`).
  - Update translation files (`locale/translation`) to use "Patient" instead of "Customer" or "Client".
  - Update navigation menus and dashboard widgets appropriately.

### Phase 2: Appointments Management
**Objective:** Introduce a robust scheduling system for the clinic.
- **Backend:** 
  - Create a new `Appointment.js` model comprising fields: `patient` (ref: Patient), `date`, `time`, `duration`, `status` (Scheduled, Completed, Cancelled), `dentist` (ref: Admin), and `notes`.
  - Create CRUD endpoints for Appointments.
- **Frontend:** 
  - Create an `AppointmentModule` including a Data Table and a Calendar View (using a suitable React calendar library or Ant Design Calendar).
  - Add "Appointments" to the main side navigation.
  - Add quick action "New Appointment" to the dashboard.

### Phase 3: Dental Invoices & Moroccan Localization (MAD & VAT)
**Objective:** Adapt billing to dental treatments using the local currency and tax rules.
- **Backend:** 
  - Modify `Invoice.js` model items to represent specific "Treatments" instead of generic products.
  - Default the `currency` field to `MAD` (Moroccan Dirham).
  - Implement Moroccan VAT logic (standardizing the `taxRate` to typical Moroccan dental tax rates, or making it flexible for the user).
- **Frontend:** 
  - Update `InvoiceForm.jsx` to reflect dental treatments with a dropdown or catalog.
  - Enforce MAD format in all UI components where currency is displayed.
  - Customize the Invoice PDF template to match Moroccan medical billing standards.

### Phase 4: Basic Financial Reports
**Objective:** Provide clinic administrators with insights into their revenue.
- **Backend:** 
  - Create aggregation pipelines for computing daily, weekly, monthly, and yearly revenue based on `Payment` and `Invoice` collections.
- **Frontend:** 
  - Build a `ReportsModule` with charts (using existing AntD components or external libraries like Recharts) displaying income trends, unpaid invoices, and tax summaries.

### Phase 5: Testing & Deployment
- E2E Testing for new user flows (Patient creation → Appointment → Treatment Invoice).
- Quality Assurance on localized elements (French/Arabic/English UI translations, MAD currency formats).
- Production deployment setup targeting cloud infrastructure.
