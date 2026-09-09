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

    const UserModel = mongoose.model(userModel);
    const user = await UserModel.findOne({ _id: verified.id, removed: false });
    if (!user || user.enabled === false) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled or does not exist',
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

    // Preserve selected session lifetime during refresh (30d for remember me, otherwise 7d)
    const isRemembered = Boolean(
      verified.remember || (verified.exp && verified.iat && (verified.exp - verified.iat > 8 * 24 * 60 * 60))
    );

    const crypto = require('crypto');
    const sessionId = verified.sessionId || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

    // Generate new access token
    const newToken = jwt.sign(
      { id: verified.id, sessionId },
      process.env[jwtSecret],
      { expiresIn: '15m' }
    );

    // Generate new rotated refresh token with preserved lifetime
    const newRefreshToken = jwt.sign(
      { id: verified.id, sessionId, remember: isRemembered },
      process.env[jwtSecret],
      { expiresIn: isRemembered ? '30d' : '7d' }
    );

    // Pull the old refresh token to invalidate it (rotation)
    await UserPassword.findOneAndUpdate(
      { _id: userPassword._id },
      { $pull: { loggedSessions: refreshToken } }
    ).exec();

    // Add new tokens to loggedSessions safely up to limit
    await UserPassword.findOneAndUpdate(
      { _id: userPassword._id },
      { $push: { loggedSessions: { $each: [newToken, newRefreshToken], $slice: -50 } } }
    ).exec();

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
