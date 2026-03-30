# Schema Audit & Data Consistency Report - Ubinarys Dental

This document tracks the audit of data entry points (forms, API models) against the backend Mongoose schemas to ensure data integrity.

## Entities Checked

- [x] **Client (Patient)**
- [x] **Appointment**
- [x] **Invoice**
- [x] **Quote (Devis)**
- [x] **Payment (Paiements)**
- [x] **Treatment (Soins)**
- [x] **Taxes**

## Identified Mismatches and Fixes

### 1. Client (Patient)
- **Mismatch**: Schema defaulted `type` to `company`, but this is a dental app (Patient = People).
- **Mismatch**: Schema `email` was optional, but the React form required it.
- **Mismatch**: `address` was present in the schema but missing from the simplified Patient form.
- **Fix**: Updated `Client.js` to default to `people` and made `email` required.
- **Fix**: Added `address` field to `CustomerForm.jsx`.

### 2. Invoice & Quote
- **Mismatch**: Backend Joi validation (`schemaValidate.js`) marked `number` and `year` as `required()`, but the controllers were refactored to handle these authoritatively on the server. This caused validation failures if the frontend didn't supply them.
- **Fix**: Changed `number` and `year` to `optional()` in Joi validation to allow server-side assignment.

### 3. Payment
- **Mismatch**: `Payment.js` schema requires `number` field, but `paymentController/create.js` was creating documents directly from `req.body` without assigning a sequential number or checking a counter.
- **Fix**: Implemented authoritative sequential numbering for Payments (`last_payment_number`).

### 4. Appointment
- **Status**: Perfectly consistent with forms. No changes needed.

### 5. Treatment
- **Status**: Updated earlier with `price` and `duration` fields. Consistent with current form.

---

## Remaining TODOs
- [ ] Implement manual entry prevention for invoice/quote numbers on the frontend (read-only fields).
- [ ] Add unit tests for authoritative numbering to prevent race conditions during heavy usage.
