const mongoose = require('mongoose');
const Admin = mongoose.model('Admin');
const AdminPassword = mongoose.model('AdminPassword');
const { generate: uniqueId } = require('shortid');
const bcrypt = require('bcryptjs');

const paginatedList = require('@/controllers/middlewaresControllers/createCRUDController/paginatedList');

const create = async (req, res) => {
  const { email, password, name, surname, role, enabled } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({
      success: false,
      message: 'Champs requis manquants : email, mot de passe, nom, rôle',
    });
  }

  const existingAdmin = await Admin.findOne({ email, removed: false });
  if (existingAdmin) {
    return res.status(409).json({
      success: false,
      message: 'Un compte avec cet e-mail existe déjà.',
    });
  }

  const newAdmin = await new Admin({
    email,
    name,
    surname,
    role,
    enabled: enabled !== undefined ? enabled : true,
  }).save();

  const salt = uniqueId();
  const passwordHash = bcrypt.hashSync(salt + password);

  await new AdminPassword({
    user: newAdmin._id,
    password: passwordHash,
    salt: salt,
    emailVerified: true,
  }).save();

  return res.status(200).json({
    success: true,
    result: newAdmin,
    message: 'Utilisateur créé avec succès',
  });
};

const list = async (req, res) => {
  return paginatedList(Admin, req, res);
};

const update = async (req, res) => {
  const { id } = req.params;
  const { password, ...updateData } = req.body;

  const result = await Admin.findOneAndUpdate({ _id: id, removed: false }, updateData, {
    new: true,
    runValidators: true,
  }).exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé',
    });
  }

  if (password) {
    const salt = uniqueId();
    const passwordHash = bcrypt.hashSync(salt + password);
    await AdminPassword.findOneAndUpdate(
      { user: id },
      { password: passwordHash, salt: salt },
      { upsert: true }
    ).exec();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Utilisateur mis à jour avec succès',
  });
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  const result = await Admin.findOneAndUpdate(
    { _id: id, removed: false },
    { enabled: enabled },
    { new: true }
  ).exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé',
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Statut mis à jour avec succès',
  });
};

module.exports = {
  create,
  list,
  update,
  updateStatus,
};
