const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Appointment');

const create = require('./create');
const update = require('./update');
const today = require('./today');
const trends = require('./trends');

methods.create = create;
methods.update = update;
methods.today = today;
methods.trends = trends;

module.exports = methods;
