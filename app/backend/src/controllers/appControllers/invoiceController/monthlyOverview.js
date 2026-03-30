const mongoose = require('mongoose');

const InvoiceModel = mongoose.model('Invoice');

const monthlyOverview = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          removed: false,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $lookup: {
          from: 'appointments', // Needs to match collection name, usually 'appointments'
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
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            dentist: '$appointmentDetails.dentist',
          },
          treatedAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$total' }, // Assuming total is stored in MAD
          unpaidInvoices: {
            $sum: { $cond: [{ $ne: ['$paymentStatus', 'paid'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'admins', // Admin collection houses the dentists
          localField: '_id.dentist',
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
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          dentistName: {
            $concat: [
              { $ifNull: ['$dentistDetails.name', 'Unknown'] },
              ' ',
              { $ifNull: ['$dentistDetails.surname', ''] }
            ]
          },
          treatedAppointments: 1,
          totalRevenue: 1,
          unpaidInvoices: 1,
        },
      },
      {
        $sort: { year: -1, month: -1, dentistName: 1 },
      },
    ];

    const results = await InvoiceModel.aggregate(pipeline);

    // Format the date string on backend for convenience
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedResults = results.map(row => ({
      ...row,
      monthName: `${months[row.month - 1]} ${row.year}`
    }));

    return res.status(200).json({
      success: true,
      result: formattedResults,
      message: 'Monthly overview fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = monthlyOverview;
