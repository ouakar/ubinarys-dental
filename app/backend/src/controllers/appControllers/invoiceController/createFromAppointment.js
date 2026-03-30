const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const { increaseBySettingKey } = require('@/middlewares/settings');
const { calculate } = require('@/helpers');

const createFromAppointment = async (req, res) => {
  const { appointment, client, treatments, year, number, date, expiredDate } = req.body;

  const safeDate = date && !isNaN(new Date(date)) ? new Date(date) : new Date();
  const safeExpiredDate = expiredDate && !isNaN(new Date(expiredDate)) ? new Date(expiredDate) : new Date(Date.now() + 7 * 86400000);

  let globalSubTotal = 0;
  let globalTaxTotal = 0;
  let globalTotal = 0;

  const items = treatments.map((item) => {
    // calculation based on MAD / VAT logic specified
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.price) || 0; // Unit HT
    const vatRate = parseFloat(item.taxRate) || 0;

    const lineSubTotal = qty * price;
    const lineTax = lineSubTotal * (vatRate / 100);
    const lineTotal = lineSubTotal + lineTax;

    globalSubTotal += lineSubTotal;
    globalTaxTotal += lineTax;
    globalTotal += lineTotal;

    return {
      itemName: item.name,
      description: item.description || '',
      quantity: qty,
      price: price, // Unit HT price
      taxRate: vatRate, // E.g., 20
      subTotal: lineSubTotal, // Total HT for this line
      taxTotal: lineTax, // Total VAT for this line
      total: lineTotal, // Total TTC for this line
    };
  });

  const payload = {
    client,
    appointment,
    number,
    year: year || new Date().getFullYear(),
    date: safeDate,
    expiredDate: safeExpiredDate,
    items,
    subTotal: globalSubTotal,
    taxTotal: globalTaxTotal,
    taxRate: 0, // We calculated items explicitly above, but global taxRate could be 0 since it is itemized
    total: globalTotal,
    currency: 'MAD',
    paymentStatus: 'unpaid',
    status: 'draft',
    createdBy: req.admin._id,
  };

  const result = await new Model(payload).save();
  const fileId = 'invoice-' + result._id + '.pdf';
  
  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    { new: true }
  ).exec();

  await increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully from Appointment',
  });
};

module.exports = createFromAppointment;
