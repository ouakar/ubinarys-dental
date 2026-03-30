const mongoose = require('mongoose');

const AppointmentModel = mongoose.model('Appointment');
const InvoiceModel = mongoose.model('Invoice');

const today = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await AppointmentModel.find({
      removed: false,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('patient', 'name phone')
      .populate('dentist', 'name surname')
      .populate('treatment', 'name price')
      .sort({ startTime: 1 })
      .lean();

    // Fetch invoices associated with today's appointments to check if one exists
    const appointmentIds = appointments.map((a) => a._id);
    const invoices = await InvoiceModel.find({
      removed: false,
      appointment: { $in: appointmentIds },
    }).lean();

    const invoiceMap = {};
    invoices.forEach((inv) => {
      invoiceMap[inv.appointment.toString()] = inv._id;
    });

    const result = appointments.map((app) => ({
      ...app,
      invoiceId: invoiceMap[app._id.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      result,
      message: 'Today appointments fetched',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = today;
