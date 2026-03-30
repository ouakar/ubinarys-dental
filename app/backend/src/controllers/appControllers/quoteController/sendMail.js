const mongoose = require('mongoose');
const Model = mongoose.model('Quote');
const sendEmail = require('@/utils/sendEmail');

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

  const subject = `Quote ${result.number}/${result.year}`;
  const html = `
    <p>Hello ${result.client.name},</p>
    <p>Please find attached your quote.</p>
    <p>Best regards,</p>
  `;

  try {
    await sendEmail({
      email: clientEmail,
      subject: subject,
      html: html,
      attachments: result.pdf ? [{
        filename: `Quote_${result.number}_${result.year}.pdf`,
        path: result.pdf
      }] : []
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
