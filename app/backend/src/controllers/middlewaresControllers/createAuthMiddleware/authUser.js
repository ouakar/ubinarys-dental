const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);

  if (!isMatch)
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Identifiants invalides.',
    });

  if (isMatch === true) {
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const isRemembered = Boolean(req.body.remember);
    const refreshToken = jwt.sign(
      { id: user._id, remember: isRemembered },
      process.env.JWT_SECRET,
      { expiresIn: isRemembered ? '30d' : '7d' }
    );

    await UserPasswordModel.findOneAndUpdate(
      { user: user._id },
      { $push: { loggedSessions: { $each: [token, refreshToken], $slice: -50 } } },
      { new: true }
    ).exec();

    res.status(200).json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role: user.role,
        email: user.email,
        photo: user.photo,
        token: token,
        refreshToken: refreshToken,
        maxAge: isRemembered ? 30 : 7,
      },
      message: 'Connexion réussie',
    });
  } else {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Identifiants invalides.',
    });
  }
};

module.exports = authUser;
