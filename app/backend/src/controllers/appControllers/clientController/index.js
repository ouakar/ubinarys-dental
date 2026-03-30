const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const summary = require('./summary');
const paginatedList = require('./paginatedList');

function modelController() {
  const Model = mongoose.model('Client');
  const methods = createCRUDController('Client');

  methods.summary = (req, res) => summary(Model, req, res);
  methods.list = paginatedList;
  return methods;
}

module.exports = modelController();
