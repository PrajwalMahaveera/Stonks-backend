const express = require('express');
const pool = require('../db');
const passport = require('passport');

const router = express.Router();

router.post('/follow', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const followerId = req.user.id;
  const { followeeId } = req.body;
  try {
    await pool.query('INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2)', [followerId, followeeId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/unfollow', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const followerId = req.user.id;
  const { followeeId } = req.body;
  try {
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [followerId, followeeId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
