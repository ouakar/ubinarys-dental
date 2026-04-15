const mongoose = require('mongoose');
const Model = mongoose.model('Quote');
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
      message: 'Aucun document ou patient trouvé',
    });
  }

  const clientEmail = result.client.email;

  if (!clientEmail) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Le patient n\'a pas d\'adresse email',
    });
  }

  const settings = await loadSettings();
  const base = process.env.PUBLIC_SERVER_FILE?.replace(/\/$/, '');
  const logo = settings.company_logo?.replace(/^\//, '');
  const logoUrl = base && logo ? `${base}/${logo}` : '';
  
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="max-height:60px; display:block; margin-bottom:12px;"/>`
    : '';

  const subject = `Quote ${result.number}/${result.year}`;
  const clinicName = settings?.company_name || 'Cabinet Dentaire';
  const html = `
    ${logoHtml}
    <h2>${clinicName}</h2>
    <p>Bonjour ${result.client.name},</p>
    <p>Veuillez trouver ci-joint votre devis.</p>
    <p>Cordialement,</p>
  `;

  try {
    const fileId = 'quote-' + result._id + '.pdf';
    const folderPath = 'quote';
    const targetLocation = `src/public/download/${folderPath}/${fileId}`;

    await new Promise((resolve, reject) => {
      custom.generatePdf(
        'Quote',
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
        filename: `Quote_${result.number}_${result.year}.pdf`,
        path: targetLocation
      }]
    });

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Email envoyé avec succès',
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
