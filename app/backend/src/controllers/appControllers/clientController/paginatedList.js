const mongoose = require('mongoose');

const Client = mongoose.model('Client');
const Appointment = mongoose.model('Appointment');

/**
 * Enriched patient list: adds lastVisit and nextAppointment for each patient.
 */
const paginatedList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const q = req.query.q?.trim();
  const filter = { removed: false };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ created: -1 }).skip(skip).limit(limit).lean(),
    Client.countDocuments(filter),
  ]);

  // Enrich each client with last visit + next appointment
  const now = new Date();
  const clientIds = clients.map((c) => c._id);

  const [lastVisits, nextAppointments] = await Promise.all([
    // Most recent completed appointment per patient
    Appointment.aggregate([
      { $match: { removed: false, status: 'done', patient: { $in: clientIds } } },
      { $sort: { startTime: -1 } },
      { $group: { _id: '$patient', lastVisit: { $first: '$startTime' } } },
    ]),
    // Next upcoming appointment per patient
    Appointment.aggregate([
      { $match: { removed: false, startTime: { $gte: now }, status: { $nin: ['done', 'no-show', 'cancelled'] }, patient: { $in: clientIds } } },
      { $sort: { startTime: 1 } },
      { $group: { _id: '$patient', nextAppointment: { $first: '$startTime' } } },
    ]),
  ]);

  const lastVisitMap = {};
  lastVisits.forEach((lv) => { lastVisitMap[lv._id.toString()] = lv.lastVisit; });

  const nextAppMap = {};
  nextAppointments.forEach((na) => { nextAppMap[na._id.toString()] = na.nextAppointment; });

  const enriched = clients.map((c) => ({
    ...c,
    lastVisit: lastVisitMap[c._id.toString()] || null,
    nextAppointment: nextAppMap[c._id.toString()] || null,
  }));

  return res.status(200).json({
    success: true,
    result: enriched,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      count: total,
    },
    message: 'Patterson list fetched successfully',
  });
};

module.exports = paginatedList;
