# Billing & Tax Design (Moroccan Context)

This document outlines the architecture for integrating Appointments with Invoicing, specifically tailored for Moroccan dental clinics operating in Dirhams (MAD) and handling Moroccan internal Tax/VAT mechanics.

## 1. Treatments Catalog (The `Product` or `Service` Model)
To avoid manual text entry for generic dental operations, IDURAR will utilize a **Treatments Catalog**. This replaces or restores the typically commented out `Product` schemas within standard IDURAR. 

### Treatment Schema (`Treatment.js` or `Product.js`)
*   **`code`** *(String, unique)*: Official dental nomenclature or internal code (e.g. `EXT-1` for simple extraction).
*   **`name`** *(String, required)*: Display name on the invoice (e.g., "Blanchiment dentaire").
*   **`defaultPrice`** *(Number, default: 0)*: Pre-filled price in MAD.
*   **`defaultVAT`** *(Number, default: 0)*: The dedicated VAT percentage. Medical/dental acts are frequently exempt (0%) or subjected to specific VAT bands (e.g., 20% for aesthetic products) in Morocco.
*   **`category`** *(String)*: Groupings like "Consultation", "Chirurgies", "Esthétique".

## 2. The "Complete & Bill" Workflow
Transitioning an appointment cleanly into revenue without manual copy-pasting is critical.

**Process Execution Flow:**
1.  **State Change:** A dentist or assistant opens a `done` appointment in the Calendar or List view.
2.  **Modal Trigger:** Clicking **"Complete & Bill"** loads a unique modal built specifically for generating an invoice.
3.  **Treatment Selection:** The user is presented with a fast Multi-Select field querying the generic `/api/treatment/search` endpoint. They pick the corresponding procedures executed during the specified visit.
4.  **Auto Calculation & Firing POST Request:**
    *   The frontend calculates the `items` payload on the fly.
    *   Fires an API call: `POST /api/invoice/create`.
    *   Upon a 200 OK response, the user is redirected to `/invoice/read/:newInvoiceId`.

## 3. Exact Invoice Structure & Moroccan Calculations
The Invoice structure embeds strict HT, VAT, and TTC rules to remain compliant with Moroccan commercial and dental regulations.

### Modifying the `Invoice.js` Schema:
1.  **Appointment Link Tracking:**
    *   Add `appointment: { type: mongoose.Schema.ObjectId, ref: 'Appointment' }` into `Invoice.js`.
    *   This establishes the relationship so that accounting algorithms can track which clinic visits yielded which revenues, and conversely flags appointments that lack billed invoices.
2.  **Line Item Adjustments (`items` array):**
    *   To support strict TTC generation, the line items must trace individual taxation. 
    *   Ensure the array holds:
        *   `treatment` (ref: Treatment)
        *   `itemName` (String Name)
        *   `quantity` (Number)
        *   `price` (Number, representing Unit HT Price)
        *   *Uncomment or add* `taxRate` (Number, explicit item tier tax).
        *   *Uncomment or add* `taxTotal` (Number, generating `(price * quantity) * (taxRate / 100)`).
        *   `total` (Line Total representing TTC line: `subTotal + taxTotal`).
3.  **Global Invoice Totals Tracking (MAD base):**
    *   `currency`: Hardcoded or preset to `"MAD"`.
    *   `subTotal`: Global HT (Hors Taxe) across all items.
    *   `taxTotal`: Global Tax / T.V.A (Taxe sur la Valeur Ajoutée).
    *   `total`: Global TTC (Toutes Taxes Comprises) payable by the patient.

## 4. Frontend Invoice Rendering
When parsing `/api/invoice/read/:id`, the generic IDURAR PDF generation logic (`src/pdf/Invoice.pug` and React `ReadItem`) must explicitly label total structures as:
*   **Total H.T** (previously "Sub Total")
*   **TVA** (previously "Tax Total")
*   **Total TTC en MAD** (previously "Total") 

By executing this design, the dental clinic cleanly generates legally compliant medical billing directly from scheduled appointments with a single-click transfer!
