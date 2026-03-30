const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Appointment');

const create = require('./create');
const update = require('./update');
const today = require('./today');

methods.create = create;
methods.update = update;
methods.today = today;

module.exports = methods;
