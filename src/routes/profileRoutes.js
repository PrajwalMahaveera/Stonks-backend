const express = require('express');
const passport = require('passport');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const router = express.Router();


// Middleware to authenticate JWT tokens
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
      const token = authHeader.split(' ')[1];
  
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
  
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };


// Fetch user profile
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.user.id;
  const { fullName, avatar, active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE profiles SET fullName = $1, avatar = $2, active = $3, updatedAt = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [fullName, avatar, active, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate 2FA secret and QR code
router.post('/2fa/setup', authenticateJWT, async (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20 });
    try {
      await pool.query(
        'INSERT INTO two_factor_auth (user_id, secret) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET secret = $2',
        [req.user.id, secret.base32]
      );
      qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.json({ secret: secret.base32, qrcode: data_url });
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Verify 2FA token
router.post('/2fa/verify', authenticateJWT, async (req, res) => {
    const { token } = req.body;
    try {
      const result = await pool.query('SELECT secret FROM two_factor_auth WHERE user_id = $1', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(400).json({ message: '2FA not setup for this user' });
      }
      const verified = speakeasy.totp.verify({
        secret: result.rows[0].secret,
        encoding: 'base32',
        token: token
      });
      if (verified) {
        res.json({ verified: true });
      } else {
        res.json({ verified: false });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });  

module.exports = router;
