const mongoose = require('mongoose');

const logout = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const refreshToken = req.body && req.body.refreshToken;

  const tokensToPull = [];
  if (token) tokensToPull.push(token);
  if (refreshToken) tokensToPull.push(refreshToken);

  if (tokensToPull.length > 0 && req.admin?._id) {
    await UserPassword.findOneAndUpdate(
      { user: req.admin._id },
      { $pull: { loggedSessions: { $in: tokensToPull } } },
      { new: true }
    ).exec();
  }

  return res.status(200).json({
    success: true,
    result: {},
    message: 'Successfully logout',
  });
};

module.exports = logout;
