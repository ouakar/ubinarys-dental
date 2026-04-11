const mongoose = require('mongoose');
const moment = require('moment');

const AppointmentModel = mongoose.model('Appointment');

const trends = async (req, res) => {
  try {
    const endDate = moment().endOf('day');
    const startDate = moment().subtract(6, 'days').startOf('day');

    const appointments = await AppointmentModel.find({
      removed: false,
      startTime: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    })
      .populate('treatment', 'category')
      .lean();

    const stats = {};
    for (let i = 0; i < 7; i++) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const dayName = moment().subtract(i, 'days').locale('fr').format('dddd');
      stats[date] = { 
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1), 
        routine: 0, 
        emergency: 0,
        sortKey: moment().subtract(i, 'days').unix()
      };
    }

    appointments.forEach((app) => {
      const dateKey = moment(app.startTime).format('YYYY-MM-DD');
      if (stats[dateKey]) {
        // Categorize: anything in category 'Urgence' or 'Chirurgie' is 'emergency', everything else is 'routine'
        const category = app.treatment?.category || 'Soins';
        if (category === 'Urgence' || category === 'Chirurgie') {
          stats[dateKey].emergency += 1;
        } else {
          stats[dateKey].routine += 1;
        }
      }
    });

    const result = Object.values(stats).sort((a, b) => a.sortKey - b.sortKey);

    return res.status(200).json({
      success: true,
      result,
      message: 'Trends data fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = trends;
