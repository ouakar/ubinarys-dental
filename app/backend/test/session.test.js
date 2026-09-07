require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_32_characters_long_minimum!';
process.env.DATABASE = 'mongodb://localhost:27017/test_db';

const app = require('../src/app');
const logoutController = require('../src/controllers/middlewaresControllers/createAuthMiddleware/logout');
const refreshController = require('../src/controllers/middlewaresControllers/createAuthMiddleware/refresh');
const updatePasswordController = require('../src/controllers/middlewaresControllers/createUserController/updatePassword');

test('Logout revokes both access token and refresh token from loggedSessions', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: fakeUserId.toString(), remember: true }, process.env.JWT_SECRET, { expiresIn: '30d' });

  const AdminPassword = mongoose.model('AdminPassword');
  let currentSessions = [token, refreshToken];

  const origFindOneAndUpdate = AdminPassword.findOneAndUpdate;
  AdminPassword.findOneAndUpdate = (query, update) => {
    if (update.$pull && update.$pull.loggedSessions) {
      const inList = update.$pull.loggedSessions.$in;
      currentSessions = currentSessions.filter((s) => !inList.includes(s));
    }
    return { exec: async () => ({ loggedSessions: currentSessions }) };
  };

  const req = {
    headers: { authorization: `Bearer ${token}` },
    body: { refreshToken },
    admin: { _id: fakeUserId },
  };
  const res = {
    status: (code) => {
      assert.strictEqual(code, 200);
      return res;
    },
    json: (data) => {
      assert.strictEqual(data.success, true);
    },
  };

  try {
    await logoutController(req, res, { userModel: 'Admin' });
    assert.strictEqual(currentSessions.includes(token), false, 'Access token must be revoked');
    assert.strictEqual(currentSessions.includes(refreshToken), false, 'Refresh token must be revoked');
  } finally {
    AdminPassword.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('Revoked refresh token cannot refresh and returns 401', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const revokedRefreshToken = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const AdminPassword = mongoose.model('AdminPassword');
  const origFindOne = AdminPassword.findOne;

  // Simulate user whose loggedSessions does NOT contain the revoked refresh token
  AdminPassword.findOne = async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: fakeUserId,
    loggedSessions: [],
  });

  const req = {
    body: { refreshToken: revokedRefreshToken },
  };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseBody = data;
    },
  };

  try {
    await refreshController(req, res, { userModel: 'Admin' });
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(responseBody.success, false);
    assert.strictEqual(responseBody.message, 'Refresh token unrecognized');
  } finally {
    AdminPassword.findOne = origFindOne;
  }
});

test('Refresh-token rotation invalidates the old token and issues new tokens', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const oldRefreshToken = jwt.sign(
    { id: fakeUserId.toString(), remember: true },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  const AdminPassword = mongoose.model('AdminPassword');
  let currentSessions = [oldRefreshToken];

  const origFindOne = AdminPassword.findOne;
  const origUpdateOne = AdminPassword.updateOne;

  AdminPassword.findOne = async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: fakeUserId,
    loggedSessions: currentSessions,
  });

  const origFindOneAndUpdate = AdminPassword.findOneAndUpdate;

  let pulledToken = null;
  let pushedTokens = [];

  AdminPassword.findOneAndUpdate = (query, update) => {
    if (update.$pull && update.$pull.loggedSessions) {
      pulledToken = update.$pull.loggedSessions;
    }
    if (update.$push && update.$push.loggedSessions) {
      pushedTokens = update.$push.loggedSessions.$each;
    }
    return { exec: async () => ({}) };
  };

  const req = {
    body: { refreshToken: oldRefreshToken },
  };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseBody = data;
    },
  };

  try {
    await refreshController(req, res, { userModel: 'Admin' });
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(responseBody.success, true);
    assert.ok(responseBody.result.token, 'New access token must be provided');
    assert.ok(responseBody.result.refreshToken, 'New refresh token must be provided');

    // Old refresh token must have been removed via $pull
    assert.strictEqual(pulledToken, oldRefreshToken, 'Old refresh token must be pulled');
    // New refresh token must be pushed
    assert.strictEqual(pushedTokens.includes(responseBody.result.refreshToken), true, 'New refresh token must be added');
  } finally {
    AdminPassword.findOne = origFindOne;
    AdminPassword.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('Password change revokes all active sessions in loggedSessions', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const activeSessionToken = 'some_active_jwt_token';

  const AdminPassword = mongoose.model('AdminPassword');
  let savedData = null;

  const origFindOneAndUpdate = AdminPassword.findOneAndUpdate;
  AdminPassword.findOneAndUpdate = (query, update) => {
    savedData = update.$set;
    return {
      exec: async () => ({ ...savedData, user: fakeUserId }),
    };
  };

  const req = {
    params: { id: fakeUserId.toString() },
    body: { password: 'NewSecurePassword123!' },
    admin: { email: 'doctor@clinic.ma', _id: fakeUserId },
  };
  const res = {
    status: (code) => {
      assert.strictEqual(code, 200);
      return res;
    },
    json: (data) => {
      assert.strictEqual(data.success, true);
    },
  };

  try {
    await updatePasswordController('Admin', req, res);
    assert.ok(savedData, 'Password update data must be saved');
    assert.deepStrictEqual(savedData.loggedSessions, [], 'loggedSessions must be emptied');
  } finally {
    AdminPassword.findOneAndUpdate = origFindOneAndUpdate;
  }
});
