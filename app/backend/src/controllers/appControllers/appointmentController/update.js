const mongoose = require('mongoose');
const Model = mongoose.model('Appointment');

const update = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check for double booking if changing time or dentist or status to overlapping
  if (updates.startTime || updates.endTime || updates.dentist || updates.status) {
    const existingObj = await Model.findById(id);
    if (!existingObj) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const checkDentist = updates.dentist || existingObj.dentist;
    const checkStartTime = updates.startTime || existingObj.startTime;
    const checkEndTime = updates.endTime || existingObj.endTime;
    const checkStatus = updates.status || existingObj.status;

    if (['booked', 'confirmed', 'in-chair'].includes(checkStatus)) {
      const overlap = await Model.findOne({
        _id: { $ne: id },
        dentist: checkDentist,
        status: { $in: ['booked', 'confirmed', 'in-chair'] },
        startTime: { $lt: checkEndTime },
        endTime: { $gt: checkStartTime },
        removed: false,
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          message: 'Double-booking detected: The dentist already has an appointment at this time.',
        });
      }
    }
  }

  const result = await Model.findOneAndUpdate(
    { _id: id, removed: false },
    updates,
    { new: true, runValidators: true }
  ).exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'No document found',
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'We update this document successfully',
  });
};

module.exports = update;
