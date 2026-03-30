const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');
const sendEmail = require('@/utils/sendEmail');
const custom = require('@/controllers/pdfController');
const { loadSettings } = require('@/middlewares/settings');

const mail = async (req, res) => {
  const { id } = req.body;

  // Find document by id
  const result = await Model.findOne({
    _id: id,
    removed: false,
  }).populate('client');

  // If no results found, return document not found
  if (!result || !result.client) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document or client found',
    });
  }

  const clientEmail = result.client.email;

  if (!clientEmail) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Client has no email address',
    });
  }

  const settings = await loadSettings();
  const base = process.env.PUBLIC_SERVER_FILE?.replace(/\/$/, '');
  const logo = settings.company_logo?.replace(/^\//, '');
  const logoUrl = base && logo ? `${base}/${logo}` : '';
  
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="max-height:60px; display:block; margin-bottom:12px;"/>`
    : '';

  const subject = `Invoice ${result.number}/${result.year}`;
  const clinicName = settings?.company_name || 'Cabinet Dentaire';
  const html = `
    ${logoHtml}
    <h2>${clinicName}</h2>
    <p>Hello ${result.client.name},</p>
    <p>Please find attached your invoice.</p>
    <p>Best regards,</p>
  `;

  try {
    const fileId = 'invoice-' + result._id + '.pdf';
    const folderPath = 'invoice';
    const targetLocation = `src/public/download/${folderPath}/${fileId}`;

    await new Promise((resolve, reject) => {
      custom.generatePdf(
        'Invoice',
        { filename: folderPath, format: 'A4', targetLocation },
        result,
        () => resolve()
      ).catch(reject);
    });

    await sendEmail({
      email: clientEmail,
      subject: subject,
      html: html,
      attachments: [{
        filename: `Invoice_${result.number}_${result.year}.pdf`,
        path: targetLocation
      }]
    });

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Email sent successfully / Email envoyé avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = mail;
