const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const passport = require('../auth');
require('../googleAuth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { fullName, username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO profiles (id, fullName, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), fullName, username, email, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: info ? info.message : 'Login failed',
        user: user
      });
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        res.send(err);
      }
      const token = jwt.sign({ id: user.id }, 'abcdefghij');
      return res.json({ token });
    });
  })(req, res);
});

//Google OAuth2 routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, 'your_jwt_secret');
    res.redirect(`/?token=${token}`);
  }
);

module.exports = router;
