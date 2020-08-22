const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');

const User = require('../models/user.js');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put(
  '/signup',
  [
    body('name').trim().not().isEmpty().isLength({ min: 5 }),
    body('password').trim().isLength({ min: 8 }),
    body('email')
      .trim()
      .isEmail()
      .custom((val, { req }) => {
        return User.findOne({ email: val }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject('Email address already exists');
          }
        });
      })
      .normalizeEmail(),
  ],
  authController.signup
);

router.get('/status', isAuth, authController.getStatus);

router.post(
  '/update-status',
  [body('status').trim().not().isEmpty()],
  isAuth,
  authController.updateStatus
);

router.post('/login', authController.login);

module.exports = router;
