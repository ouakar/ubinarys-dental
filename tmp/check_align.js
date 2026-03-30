const fs = require('fs');

const extractFormFields = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match Form.Item name="abc" or name={['abc', 'def']}
  const regex = /<Form\.Item[^>]*name={?["']?([a-zA-Z0-9_]+)/g;
  const fields = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) fields.add(match[1]);
  }
  return Array.from(fields);
};

const extractModelFields = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple extraction: look for keys before `: {` or `: [{` inside schemas
  // This is basic and might need refinement, but good for a quick check.
  const regex = /^\s*([a-zA-Z0-9_]+)\s*:\s*\{/gm;
  const fields = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    fields.add(match[1]);
  }
  return Array.from(fields);
};

const mappings = [
  { form: 'app/frontend/src/forms/CustomerForm.jsx', model: 'app/backend/src/models/appModels/Client.js' },
  { form: 'app/frontend/src/forms/AppointmentForm.jsx', model: 'app/backend/src/models/appModels/Appointment.js' },
  { form: 'app/frontend/src/forms/TreatmentForm.jsx', model: 'app/backend/src/models/appModels/Treatment.js' },
  { form: 'app/frontend/src/forms/TaxForm.jsx', model: 'app/backend/src/models/appModels/Taxes.js' },
  { form: 'app/frontend/src/forms/PaymentModeForm.jsx', model: 'app/backend/src/models/appModels/PaymentMode.js' },
  { form: 'app/frontend/src/modules/InvoiceModule/Forms/InvoiceForm.jsx', model: 'app/backend/src/models/appModels/Invoice.js' },
  { form: 'app/frontend/src/modules/QuoteModule/Forms/QuoteForm.jsx', model: 'app/backend/src/models/appModels/Quote.js' },
  { form: 'app/frontend/src/forms/PaymentForm.jsx', model: 'app/backend/src/models/appModels/Payment.js' }
];

mappings.forEach(m => {
  if (fs.existsSync(m.form) && fs.existsSync(m.model)) {
    const formFields = extractFormFields(m.form);
    const modelFields = extractModelFields(m.model);
    console.log(`\n--- ${m.form} vs ${m.model} ---`);
    console.log(`Form fields: [${formFields.join(', ')}]`);
    console.log(`Model fields: [${modelFields.join(', ')}]`);
    
    const missingInModel = formFields.filter(f => !modelFields.includes(f) && f !== 'items');
    if (missingInModel.length > 0) {
      console.log(`❌ Fields in Form but missing in Model: ${missingInModel.join(', ')}`);
    } else {
      console.log(`✅ All Form fields exist in Model`);
    }
  }
});
