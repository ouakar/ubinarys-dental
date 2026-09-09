require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_32_characters_long_minimum!';
process.env.DATABASE = 'mongodb://localhost:27017/test_db';

require('../src/models/coreModels/Admin');
require('../src/models/coreModels/AdminPassword');

const loginController = require('../src/controllers/middlewaresControllers/createAuthMiddleware/login');
const { hasRole } = require('../src/middlewares/rbacMiddleware');

test('Valid login produces JWT access token and refresh token', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const salt = 'testsalt12345';
  const password = 'CorrectPassword123!';
  const hashedPassword = bcrypt.hashSync(salt + password, 10);

  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;
  const origPasswordFindOneAndUpdate = AdminPassword.findOneAndUpdate;

  Admin.findOne = () => ({
    _id: fakeUserId,
    email: 'admin@demo.com',
    name: 'Admin',
    surname: 'User',
    role: 'admin',
    enabled: true,
  });

  AdminPassword.findOne = () => ({
    user: fakeUserId,
    salt: salt,
    password: hashedPassword,
    loggedSessions: [],
  });

  let sessions = [];
  AdminPassword.findOneAndUpdate = (query, update) => {
    if (update.$push && update.$push.loggedSessions) {
      sessions.push(...update.$push.loggedSessions.$each);
    }
    return { exec: async () => ({}) };
  };

  const req = {
    body: {
      email: 'admin@demo.com',
      password: password,
      remember: true,
    },
  };

  let statusCode = 0;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };

  try {
    await loginController(req, res, { userModel: 'Admin' });
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(responseData.success, true);
    assert.ok(responseData.result.token, 'Must return token');
    assert.ok(responseData.result.refreshToken, 'Must return refreshToken');
    assert.strictEqual(responseData.result.maxAge, 30);
    assert.strictEqual(sessions.length, 2, 'Must store token and refreshToken');
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
    AdminPassword.findOneAndUpdate = origPasswordFindOneAndUpdate;
  }
});

test('Invalid password returns 403 Forbidden', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const salt = 'testsalt12345';
  const hashedPassword = bcrypt.hashSync(salt + 'RealPassword123!', 10);

  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;

  Admin.findOne = () => ({
    _id: fakeUserId,
    email: 'admin@demo.com',
    enabled: true,
  });

  AdminPassword.findOne = () => ({
    user: fakeUserId,
    salt: salt,
    password: hashedPassword,
  });

  const req = {
    body: {
      email: 'admin@demo.com',
      password: 'WrongPassword!',
    },
  };

  let statusCode = 0;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: () => {},
  };

  try {
    await loginController(req, res, { userModel: 'Admin' });
    assert.strictEqual(statusCode, 403);
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
  }
});

test('Disabled user login is rejected with 409', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const Admin = mongoose.model('Admin');

  const origAdminFindOne = Admin.findOne;
  Admin.findOne = () => ({
    _id: fakeUserId,
    email: 'disabled@clinic.ma',
    enabled: false,
  });

  const req = {
    body: {
      email: 'disabled@clinic.ma',
      password: 'SomePassword123!',
    },
  };

  let statusCode = 0;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };

  try {
    await loginController(req, res, { userModel: 'Admin' });
    assert.strictEqual(statusCode, 409);
    assert.strictEqual(responseData.success, false);
    assert.match(responseData.message, /désactivé/);
  } finally {
    Admin.findOne = origAdminFindOne;
  }
});

test('Two concurrent desktop logins do not terminate earlier sessions', async () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const salt = 'testsalt12345';
  const password = 'Password123!';
  const hashedPassword = bcrypt.hashSync(salt + password, 10);

  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;
  const origPasswordFindOneAndUpdate = AdminPassword.findOneAndUpdate;

  Admin.findOne = () => ({
    _id: fakeUserId,
    email: 'doctor@clinic.ma',
    name: 'Doctor',
    role: 'dentist',
    enabled: true,
  });

  AdminPassword.findOne = () => ({
    user: fakeUserId,
    salt,
    password: hashedPassword,
  });

  const activeSessions = [];
  AdminPassword.findOneAndUpdate = (query, update) => {
    if (update.$push && update.$push.loggedSessions) {
      activeSessions.push(...update.$push.loggedSessions.$each);
    }
    return { exec: async () => ({}) };
  };

  const createRes = () => {
    let result = null;
    return {
      status: () => ({
        json: (d) => {
          result = d;
        },
      }),
      getResult: () => result,
    };
  };

  try {
    // Desktop 1 Login
    const res1 = createRes();
    await loginController(
      { body: { email: 'doctor@clinic.ma', password, remember: false } },
      res1,
      { userModel: 'Admin' }
    );
    const token1 = res1.getResult().result.token;
    assert.ok(activeSessions.includes(token1));

    // Desktop 2 Login
    const res2 = createRes();
    await loginController(
      { body: { email: 'doctor@clinic.ma', password, remember: false } },
      res2,
      { userModel: 'Admin' }
    );
    const token2 = res2.getResult().result.token;
    assert.ok(activeSessions.includes(token2));

    // Both desktop sessions remain active in loggedSessions
    assert.ok(activeSessions.includes(token1), 'Desktop 1 session must not be terminated');
    assert.ok(activeSessions.includes(token2), 'Desktop 2 session must be active');
    assert.notStrictEqual(token1, token2, 'Each login must produce distinct tokens');
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
    AdminPassword.findOneAndUpdate = origPasswordFindOneAndUpdate;
  }
});

test('Role authorization middleware enforces role permissions', async () => {
  const middleware = hasRole(['owner', 'admin']);

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  // Authorized role
  let resCode = 0;
  const res = {
    status: (c) => {
      resCode = c;
      return res;
    },
    json: () => {},
  };

  middleware({ admin: { role: 'admin' } }, res, next);
  assert.strictEqual(nextCalled, true, 'Admin must be authorized');

  // Unauthorized role
  nextCalled = false;
  middleware({ admin: { role: 'assistant' } }, res, next);
  assert.strictEqual(nextCalled, false, 'Assistant must be rejected for admin/owner only route');
  assert.strictEqual(resCode, 403);
});

test('isValidAuthToken validates access token and attaches admin to request', async () => {
  const isValidAuthToken = require('../src/controllers/middlewaresControllers/createAuthMiddleware/isValidAuthToken');
  const jwt = require('jsonwebtoken');
  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');
  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;

  Admin.findOne = async () => ({
    _id: fakeUserId,
    email: 'admin@demo.com',
    enabled: true,
  });

  AdminPassword.findOne = async () => ({
    user: fakeUserId,
    loggedSessions: [token],
  });

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const req = {
    headers: { authorization: `Bearer ${token}` },
  };
  const res = {
    status: () => res,
    json: () => {},
  };

  try {
    await isValidAuthToken(req, res, next, { userModel: 'Admin' });
    assert.strictEqual(nextCalled, true, 'Valid token must call next()');
    assert.ok(req.admin, 'Admin must be attached to request');
    assert.strictEqual(req.admin.email, 'admin@demo.com');
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
  }
});

test('isValidAuthToken rejects revoked access token not in loggedSessions', async () => {
  const isValidAuthToken = require('../src/controllers/middlewaresControllers/createAuthMiddleware/isValidAuthToken');
  const jwt = require('jsonwebtoken');
  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');
  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;

  Admin.findOne = async () => ({
    _id: fakeUserId,
    email: 'admin@demo.com',
    enabled: true,
  });

  AdminPassword.findOne = async () => ({
    user: fakeUserId,
    loggedSessions: ['some_other_token'], // does not include token
  });

  let statusCode = 0;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };

  const req = {
    headers: { authorization: `Bearer ${token}` },
  };

  try {
    await isValidAuthToken(req, res, () => {}, { userModel: 'Admin' });
    assert.strictEqual(statusCode, 401, 'Revoked token must return 401');
    assert.strictEqual(responseData.success, false);
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
  }
});
