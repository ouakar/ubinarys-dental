const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const manageUser = require('./manageUser');

const userController = createUserController('Admin');

userController.create = (req, res) => manageUser.create(req, res);
userController.list = (req, res) => manageUser.list(req, res);
userController.update = (req, res) => manageUser.update(req, res);
userController.updateStatus = (req, res) => manageUser.updateStatus(req, res);

module.exports = userController;
