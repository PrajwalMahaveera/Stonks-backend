const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to check if the user is a SUPERADMIN, HOST, or ADMIN
const checkRole = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  };
};

// Middleware to authenticate JWT tokens (simplified for example purposes)
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

// Create a new channel
router.post('/', authenticateJWT, checkRole(['SUPERADMIN', 'HOST']), async (req, res) => {
  try {
    const { name, description } = req.body;
    const newChannel = await pool.query(
      'INSERT INTO channels (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(newChannel.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an existing channel
router.put('/:id', authenticateJWT, checkRole(['SUPERADMIN', 'HOST', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updatedChannel = await pool.query(
      'UPDATE channels SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (updatedChannel.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json(updatedChannel.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a channel
router.delete('/:id', authenticateJWT, checkRole(['SUPERADMIN', 'HOST']), async (req, res) => {
  try {
    const { id } = req.params;
    const deletedChannel = await pool.query(
      'DELETE FROM channels WHERE id = $1 RETURNING *',
      [id]
    );
    if (deletedChannel.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get channel information
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await pool.query('SELECT * FROM channels WHERE id = $1', [id]);
    if (channel.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json(channel.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set admin
router.post('/setAdmin/:channelId/:userId', authenticateJWT, checkRole(['HOST']), async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    await pool.query('UPDATE users SET role = $1 WHERE id = $2 AND channel_id = $3', ['ADMIN', userId, channelId]);
    res.json({ message: 'User set as admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unset admin
router.post('/unsetAdmin/:channelId/:userId', authenticateJWT, checkRole(['HOST']), async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    await pool.query('UPDATE users SET role = $1 WHERE id = $2 AND channel_id = $3', ['USER', userId, channelId]);
    res.json({ message: 'User unset as admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mute user
router.post('/mute/:channelId/:userId', authenticateJWT, checkRole(['HOST', 'ADMIN']), async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    await pool.query('UPDATE users SET muted = true WHERE id = $1 AND channel_id = $2', [userId, channelId]);
    res.json({ message: 'User muted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unmute user
router.post('/unmute/:channelId/:userId', authenticateJWT, checkRole(['HOST', 'ADMIN']), async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    await pool.query('UPDATE users SET muted = false WHERE id = $1 AND channel_id = $2', [userId, channelId]);
    res.json({ message: 'User unmuted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ban user
router.post('/ban/:channelId/:userId', authenticateJWT, checkRole(['HOST', 'ADMIN']), async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    await pool.query('UPDATE users SET banned = true WHERE id = $1 AND channel_id = $2', [userId, channelId]);
    res.json({ message: 'User banned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unban user
router.post('/unban/:channelId/:userId', authenticateJWT, checkRole(['HOST', 'ADMIN']), async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    await pool.query('UPDATE users SET banned = false WHERE id = $1 AND channel_id = $2', [userId, channelId]);
    res.json({ message: 'User unbanned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Suspend channel
router.post('/suspend/:id', authenticateJWT, checkRole(['SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE channels SET suspended = true WHERE id = $1', [id]);
    res.json({ message: 'Channel suspended' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set channel title
router.post('/setTitle/:id', authenticateJWT, checkRole(['HOST', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    await pool.query('UPDATE channels SET name = $1 WHERE id = $2', [title, id]);
    res.json({ message: 'Channel title updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set channel description
router.post('/setDescription/:id', authenticateJWT, checkRole(['HOST', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    await pool.query('UPDATE channels SET description = $1 WHERE id = $2', [description, id]);
    res.json({ message: 'Channel description updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
