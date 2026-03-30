const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Invoice');

const sendMail = require('./sendMail');
const create = require('./create');
const summary = require('./summary');
const update = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');
const read = require('./read');
const dailyCash = require('./dailyCash');

const createFromAppointment = require('./createFromAppointment');

methods.mail = sendMail;
methods.create = create;
methods.createFromAppointment = createFromAppointment;
methods.dailyCash = dailyCash;
methods.update = update;
methods.delete = remove;
methods.summary = summary;
methods.list = paginatedList;
methods.read = read;

const monthlyOverview = require('./monthlyOverview');
methods.monthlyOverview = monthlyOverview;

module.exports = methods;
