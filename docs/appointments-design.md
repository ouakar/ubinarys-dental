# Appointments Module Design

This document outlines the architecture and implementation design for the new **Appointments** module tailored for Moroccan dental clinics.

---

## 1. MongoDB Schema (`Appointment.js`)
The `Appointment` collection will serve as the core tracking mechanism for clinic schedules, chair allocations, and dentist loads.

### Proposed Fields:
*   **`patient`** *(ObjectId, ref: 'Client' / 'Patient', required)*: Maps to the patient profile.
*   **`dentist`** *(ObjectId, ref: 'Admin', required)*: Specifies which doctor is assigned. To filter dentists accurately, we may need a specific role or flag on the Admin model.
*   **`clinic`** *(String / ObjectId, optional)*: For multi-clinic setups, identifies the branch.
*   **`startTime`** *(Date, required)*: The exact start date and time of the booking.
*   **`endTime`** *(Date, required)*: The end date and time, computing total duration natively.
*   **`status`** *(String, enum, default: 'booked')*: 
    *   `'booked'`: Requested slot.
    *   `'confirmed'`: Patient confirmed over phone/SMS.
    *   `'in-chair'`: Patient is currently undergoing treatment.
    *   `'done'`: Appointment completed.
    *   `'no-show'`: Patient did not arrive.
*   **`reason`** *(String)*: Brief description (e.g., "Routine Cleanup", "Implants").
*   **`chairRoom`** *(String, optional)*: Explicit chair or room assignment indicating where the procedure takes place.
*   **`notes`** *(String)*: Internal clinical or reception remarks.

---

## 2. REST API Endpoints
The backend routing will follow the established dynamic ERP controller layout (`/api/appointment/`), implementing custom query endpoints.

*   `GET /api/appointment/list`
    *   *Parameters:* Supports query strings for `date` ranges, `dentist` IDs, and specific `status` arrays.
*   `POST /api/appointment/create`
    *   Accepts form data. Verifies if `dentist` + `startTime` overlaps with another confirmed record to prevent double-booking.
*   `PATCH /api/appointment/update/:id`
    *   Updates standard metadata (moving times, changing chairs, altering reason texts).
*   `PATCH /api/appointment/status/:id`
    *   A rapid-action endpoint explicitly reserved for toggling statuses (e.g. moving from `booked` to `in-chair`).
*   `DELETE /api/appointment/delete/:id` (or Cancel)
    *   Soft-deletes or completely wipes accidental duplicate records.

---

## 3. Frontend Views & Components

### 3.1 Appointments Data Table
We will construct an `AppointmentModule` referencing the existing generic structural pattern (`CrudModule`). 
*   **Filters:** Top-level dropdown filters for Date, Dentist Name, and Status using Ant Design's `<Select />` and `<DatePicker.RangePicker />`.
*   **Columns:** Status (with color-coded tags: green/done, yellow/booked, red/no-show), Patient Name (clickable Link), Dentist, Date/Time, Reason.

### 3.2 Dentist Calendar View
Instead of solely relying on the raw data table, a functional clinic requires visual blocks.
*   Using **Ant Design Calendar** (or integrating a lightweight library like FullCalendar for React).
*   Configured for "Day" and "Week" modes. 
*   Events will render natively on the grid spanning from `startTime` to `endTime`. 
*   Clicking a time block triggers a quick sidebar drawer or modal to create a booking at that time.

### 3.3 New Appointment Form
A `DynamicForm` instance capturing the appointment schema.
*   `patient`: Autocomplete `<Select />` searching the API automatically by Name/Phone.
*   `dentist`: Dropdown of active internal doctors.
*   `startTime` & `endTime`: `<DatePicker showTime />` capturing exact intervals.
*   `status`: Initial standard select defaulting to 'booked'.

---

## 4. Workflow Integration: "Done" Appointments ➔ Invoicing
The essential bridge turning scheduling into revenue involves linking completed appointments directly into the IDURAR Invoice ecosystem.

**The Workflow:**
1.  Once the patient's sequence is resolved, the doctor or receptionist clicks a button rendering a **"Complete & Bill"** action, shifting the appointment status to `'done'`.
2.  A unified modal prompts the staff to select the specific **Treatments** performed during the visit (from a predefined catalog of dental codes/offerings).
3.  The UI compiles these treatments and automatically triggers a `POST /api/invoice/create`.
4.  **Auto-Populated Invoice Data:**
    *   `client` references the same `patient` ID attached to the appointment.
    *   `items` array injects the selected treatments with standard **MAD formatting** prices.
    *   Standard Moroccan VAT is automatically appended to the `taxRate`.
    *   The `status` lands in `'draft'` or `'unpaid'`, ready for immediate checkout printing or emailing.
5.  *(Optional Reference):* We can map an `appointment_id` inside the `Invoice.js` schema to inherently track which invoice belongs to which specific visit.
