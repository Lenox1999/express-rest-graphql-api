const bcrypt = require('bcrypt');

const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    const error = new Error(
      'Validation failed, entered data is incorrect'
    );
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email: email,
      password: hashedPassword,
      name: name,
    });
    const result = await user.save();
    res.status(201).json({
      message: 'Successfully created user!',
      userId: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  try {
    const user = await User.findOne({ email: email });
    console.log(email);
    if (!user) {
      const error = new Error(
        'A user with this email could not be found'
      );
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Wrong password');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      'secret',
      { expiresIn: '1h' }
    );
    res
      .status(200)
      .json({ token: token, userId: loadedUser._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  if (!req.get('Authorization')) {
    throw new Error('there wasnt any data');
  }

  const token = req.get('Authorization').split(' ')[1];

  const decodedToken = jwt.decode(token);
  try {
    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      const error = new Error('No user could be found');
      error.statusCode = 500;
      throw error;
    }
    const status = user.status;
    res.status(200).json({ status: status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const token = req.body.token;
  const status = req.body.status;

  const decodedToken = jwt.decode(token);

  try {
    const user = await User.findOne({ email: decodedToken.email });
    console.log(user);
    if (!user) {
      const error = new Error('No user for provided token');
      error.statusCode = 500;
      throw error;
    }

    user.status = status;
    await user.save();
    res.status(201).json({ message: 'Status updated successfully' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
