const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey, loadSettings } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = value;
  
  // Always get authoritative number from backend counter
  const settings = await loadSettings();
  const nextNumber = (settings.last_invoice_number || 0) + 1;
  body.number = nextNumber;
  body.year = new Date().getFullYear();
  
  // Guard the dates against invalid casts
  let safeDate = body.date && !isNaN(new Date(body.date)) ? new Date(body.date) : new Date();
  let safeExpiredDate = body.expiredDate && !isNaN(new Date(body.expiredDate)) ? new Date(body.expiredDate) : new Date(Date.now() + 30 * 86400000);
  
  body.date = safeDate;
  body.expiredDate = safeExpiredDate;

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let quantity = parseFloat(item['quantity']) || 1;
    let price = parseFloat(item['price']) || 0;
    item['quantity'] = quantity;
    item['price'] = price;
    let itemTotal = quantity * price;
    //sub total
    subTotal += itemTotal;
    //item total
    item['total'] = itemTotal;
  });
  taxTotal = subTotal * (parseFloat(taxRate) / 100 || 0);
  total = subTotal + taxTotal;

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;

  let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

  body['paymentStatus'] = paymentStatus;
  body['createdBy'] = req.admin._id;

  // Creating a new document in the collection
  const result = await new Model(body).save();
  const fileId = 'invoice-' + result._id + '.pdf';
  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
