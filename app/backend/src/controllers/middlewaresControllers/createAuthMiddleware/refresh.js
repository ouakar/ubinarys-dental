const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const refresh = async (req, res, { userModel, jwtSecret = 'JWT_SECRET' }) => {
  try {
    const UserPassword = mongoose.model(userModel + 'Password');
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    let verified;
    try {
      verified = jwt.verify(refreshToken, process.env[jwtSecret]);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired or invalid',
        jwtExpired: true,
      });
    }

    const userPassword = await UserPassword.findOne({ user: verified.id, removed: false });
    if (!userPassword || !userPassword.loggedSessions.includes(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token unrecognized',
        jwtExpired: true,
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: verified.id },
      process.env[jwtSecret],
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: verified.id },
      process.env[jwtSecret],
      { expiresIn: '7d' }
    );

    // Pull the old refresh token to invalidate it
    await UserPassword.updateOne(
      { _id: userPassword._id },
      { $pull: { loggedSessions: refreshToken } }
    );

    // Add new tokens to loggedSessions safely up to limit
    await UserPassword.updateOne(
      { _id: userPassword._id },
      { $push: { loggedSessions: { $each: [newToken, newRefreshToken], $slice: -50 } } }
    );

    return res.status(200).json({
      success: true,
      result: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = refresh;
