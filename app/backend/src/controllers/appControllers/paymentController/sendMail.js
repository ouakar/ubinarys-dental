const mongoose = require('mongoose');
const Model = mongoose.model('Payment');
const sendEmail = require('@/utils/sendEmail');
const custom = require('@/controllers/pdfController');
const { loadSettings } = require('@/middlewares/settings');

const mail = async (req, res) => {
  const { id } = req.body;

  const result = await Model.findOne({
    _id: id,
    removed: false,
  }).populate('client');

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
  const logoUrl = settings.company_logo ? process.env.PUBLIC_SERVER_FILE + settings.company_logo : '';
  const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 80px; margin-bottom: 20px;"/><br>` : '';

  const subject = `Payment Receipt ${result.number}`;
  const html = `
    ${logoHtml}
    <p>Hello ${result.client.name},</p>
    <p>Thank you for your payment of ${result.amount || 0} ${result.currency || 'MAD'}. Please find attached your payment receipt.</p>
    <p>Best regards,</p>
  `;

  try {
    const fileId = 'payment-' + result._id + '.pdf';
    const folderPath = 'payment';
    const targetLocation = `src/public/download/${folderPath}/${fileId}`;

    await new Promise((resolve, reject) => {
      custom.generatePdf(
        'Payment',
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
        filename: `Payment_Receipt_${result.number}.pdf`,
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
