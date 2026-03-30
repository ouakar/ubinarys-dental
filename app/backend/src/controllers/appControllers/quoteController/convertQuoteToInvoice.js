const mongoose = require('mongoose');
const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');

const { increaseBySettingKey, loadSettings } = require('@/middlewares/settings');

const convertQuoteToInvoice = async (req, res) => {
  const { id } = req.params;

  const quote = await Quote.findOne({ _id: id, removed: false });

  if (!quote) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Quote not found',
    });
  }

  if (quote.converted) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'This quote has already been converted to an invoice.',
    });
  }

  // Get next invoice number
  const settings = await loadSettings();
  const nextNumber = (settings.last_invoice_number || 0) + 1;

  const today = new Date();
  const dueDate = new Date(today.getTime() + 30 * 86400000);

  const invoicePayload = {
    number: nextNumber,
    year: today.getFullYear(),
    date: quote.date || today,
    expiredDate: quote.expiredDate || dueDate,
    client: quote.client,
    items: quote.items,
    subTotal: quote.subTotal,
    taxTotal: quote.taxTotal || 0,
    taxRate: quote.taxRate || 0,
    total: quote.total,
    currency: 'MAD',
    discount: quote.discount || 0,
    paymentStatus: 'unpaid',
    status: 'draft',
    createdBy: req.admin._id,
    converted: {
      from: 'quote',
      quote: quote._id,
    },
  };

  const invoice = await new Invoice(invoicePayload).save();
  const fileId = 'invoice-' + invoice._id + '.pdf';
  const updatedInvoice = await Invoice.findOneAndUpdate(
    { _id: invoice._id },
    { pdf: fileId },
    { new: true }
  ).exec();

  // Mark quote as converted
  await Quote.findOneAndUpdate({ _id: id }, { converted: true }).exec();

  await increaseBySettingKey({ settingKey: 'last_invoice_number' });

  return res.status(200).json({
    success: true,
    result: updatedInvoice,
    message: 'Quote successfully converted to Invoice',
  });
};

module.exports = convertQuoteToInvoice;
