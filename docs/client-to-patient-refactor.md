# Client to Patient Refactoring Plan

## 1. Backend Files and Models using `Client` / `client`
Based on our codebase scanning, the following backend components tightly integrate with the `Client` entity:

### Models
- `src/models/appModels/Client.js` (The core schema)
- `src/models/appModels/Invoice.js` (References `client` via `ref: 'Client'`)
- `src/models/appModels/Payment.js` (References `client` via `ref: 'Client'`)
- `src/models/appModels/Quote.js` (References `client` via `ref: 'Client'`)

### Controllers
Due to the app's dynamic auto-routing architecture based on controller nomenclature:
- `src/controllers/appControllers/clientController/index.js` (Exposes CRUD controllers for `/api/client/`)
- `src/controllers/appControllers/clientController/summary.js` (Handles dashboard summary aggregation for `/api/client/summary`)
- `src/controllers/appControllers/invoiceController/schemaValidate.js` (References constraints tied to `client`)

### Views (PDF Generators)
- `src/pdf/Invoice.pug`
- `src/pdf/Quote.pug`
- `src/pdf/Payment.pug`
- `src/pdf/Offer.pug`
*(These files traverse the relation using `#{model.client.name}`, `#{model.client.address}`, etc.)*

### Setup / Configurations
- `src/setup/defaultSettings/clientSettings.json`
- `src/setup/defaultSettings/invoiceSettings.json`
- `src/setup/defaultSettings/quoteSettings.json`

---

## 2. Frontend API Calls Hitting `/client` Endpoints
The IDURAR frontend architecture dynamically maps REST endpoints by injecting an `entity` string. All requests fetching, updating, or deleting customers implicitly hit `/api/client/` through the following configuration strings:

- **Entity Targets:**
  - `src/pages/Customer/index.jsx` (`const entity = 'client';`)
  - `src/pages/Invoice/index.jsx` (`entity: 'client'`)
  - `src/pages/Payment/index.jsx` (`entity: 'client'`)
  - `src/pages/Quote/index.jsx` (`entity: 'client'`)
  - `src/modules/DashboardModule/index.jsx` (`request.summary({ entity: 'client' })`)
  - `src/modules/InvoiceModule/Forms/InvoiceForm.jsx` (`entity={'client'}`)
  - `src/modules/QuoteModule/Forms/QuoteForm.jsx` (`entity={'client'}`)

- **State/Prop Traversals (Dependent on Backend JSON response):**
  - Read Item components referencing `currentErp.client.name` (e.g., `ReadItem.jsx`, `Payment.jsx` across Payment and Invoice Modules).

---

## 3. Step-by-Step Refactoring Plan Target (Zero Downtime approach)
To safely alter the core data models without causing unhandled exceptions in production, the following pipeline is proposed:

### Phase A: MongoDB Field & Database Migration
Because Mongoose maps `mongoose.model('Client')` to a collection named `clients`, renaming the file and model to `Patient` automatically pushes the app to read from `patients`. Since existing users have `clients` records, we must migrate existing data.
1. **Prepare a script** to execute immediately before deploying the updated backend codebase:
   ```javascript
   // 1. Rename the Collection
   db.clients.renameCollection('patients');

   // 2. Rename the nested ObjectId references natively sitting in associated models
   db.invoices.updateMany({}, { $rename: { "client": "patient" } });
   db.quotes.updateMany({}, { $rename: { "client": "patient" } });
   db.payments.updateMany({}, { $rename: { "client": "patient" } });
   ```

### Phase B: Backend Refactoring
1. **Rename Files & Directories:**
   - Rename `Client.js` to `Patient.js`
   - Rename `clientController/` folder to `patientController/`
2. **Update Schemas:**
   - Inside `Patient.js`, export as `mongoose.model('Patient', schema)`.
   - In `Invoice.js`, `Quote.js`, and `Payment.js`, rename the `client` parameter to `patient` and explicitly point relational `ref` targeting to `'Patient'`.
3. **Pug Templates Updates:**
   - Find all `#{model.client.*}` inside `src/pdf/*.pug` and replace them with `#{model.patient.*}` so printed documents compile.

### Phase C: Frontend Refactoring
1. **Update API entity pointers:**
   - In all files catalogued in the "Frontend API Calls" section, replace `entity: 'client'` with `entity: 'patient'`.
2. **Access Path Fixes:**
   - Search across `src/` for dot notation objects parsing the API response (e.g., `client.name`, `currentErp.client`) and safely rename them to `patient.name` and `currentErp.patient`.

### Notes on Execution and Preventing Downtime
* **Lock Writes during Migration Window**: Due to the immediate disconnect when renaming Collections, place the web UI in "Maintenance Mode" (or block `POST/PATCH` actions) for roughly 1-2 minutes while the `renameCollection` and update scripts execute.
* **Compatibility Layer (Zero-Downtime Option)**: If dropping the environment for two minutes is strictly unauthorized, we can maintain `mongoose.model('Patient')` while instructing Mongoose to bind to the archaic Collection by supplying `{ collection: 'clients' }` to the Schema layout. We would also maintain the `client` field name natively in the `Invoice` database models. *This leaves a slight amount of technical debt but 100% prevents MongoDB downtime.*
