const mongoose = require('mongoose');
const moment = require('moment'); // UBINARYS uses moment or just standard js dates. I'll use native JS dates or dayjs.

const Model = mongoose.model('Invoice');

const dailyCash = async (req, res) => {
  try {
    const { date } = req.query;
    
    let targetDate = new Date();
    if (date && !isNaN(new Date(date))) {
      targetDate = new Date(date);
    }
    
    // Set to start and end of the day
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 1. Group by Dentist calculation
    const aggregatedData = await Model.aggregate([
      {
        $match: {
          removed: false,
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentDetails',
        },
      },
      {
        $unwind: {
          path: '$appointmentDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'appointmentDetails.dentist',
          foreignField: '_id',
          as: 'dentistDetails',
        },
      },
      {
        $unwind: {
          path: '$dentistDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            dentistId: '$dentistDetails._id',
            dentistName: '$dentistDetails.name',
            dentistSurname: '$dentistDetails.surname',
            paymentStatus: '$paymentStatus',
          },
          totalInvoices: { $sum: 1 },
          totalHT: { $sum: '$subTotal' },
          totalVAT: { $sum: '$taxTotal' },
          totalTTC: { $sum: '$total' },
        },
      },
      {
        $project: {
          _id: 0,
          dentistId: '$_id.dentistId',
          dentistName: '$_id.dentistName',
          dentistSurname: '$_id.dentistSurname',
          paymentStatus: '$_id.paymentStatus',
          totalInvoices: 1,
          totalHT: 1,
          totalVAT: 1,
          totalTTC: 1,
        },
      },
    ]);

    // Format grouped data to unify dentists (e.g. merge their paid/unpaid if preferred, or keep as is)
    const dentistsMap = {};
    aggregatedData.forEach(item => {
      const name = item.dentistId ? `${item.dentistName} ${item.dentistSurname || ''}`.trim() : 'Unknown Dentist / Direct Bill';
      if (!dentistsMap[name]) {
        dentistsMap[name] = {
          dentistName: name,
          invoicesCount: 0,
          totalHT: 0,
          totalVAT: 0,
          totalTTC: 0,
          statuses: {}
        };
      }
      dentistsMap[name].invoicesCount += item.totalInvoices;
      dentistsMap[name].totalHT += item.totalHT;
      dentistsMap[name].totalVAT += item.totalVAT;
      dentistsMap[name].totalTTC += item.totalTTC;
      dentistsMap[name].statuses[item.paymentStatus] = (dentistsMap[name].statuses[item.paymentStatus] || 0) + item.totalTTC;
    });

    const groupedReport = Object.values(dentistsMap);

    // 2. Unpaid invoices list for that day
    const unpaidInvoices = await Model.find({
      removed: false,
      date: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: { $ne: 'paid' },
    }).populate('client', 'name phone').lean();

    return res.status(200).json({
      success: true,
      result: {
        targetDate: startOfDay,
        groupedByDentist: groupedReport,
        unpaidInvoices: unpaidInvoices,
      },
      message: 'Daily Cash Report fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = dailyCash;
