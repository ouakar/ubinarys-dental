const mongoose = require('mongoose');
const Model = mongoose.model('Appointment');

const create = async (req, res) => {
  const { dentist, startTime, endTime, status } = req.body;

  // Check for double booking
  if (dentist && ['booked', 'confirmed', 'in-chair'].includes(status || 'booked')) {
    const overlap = await Model.findOne({
      dentist,
      status: { $in: ['booked', 'confirmed', 'in-chair'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      removed: false,
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: 'Double-booking detected: The dentist already has an appointment at this time.',
      });
    }
  }

  // Creating a new document in the collection
  const result = await new Model(req.body).save();
  
  // Returning successful response
  return res.status(200).json({
    success: true,
    result,
    message: 'Appointment created successfully',
  });
};

module.exports = create;
