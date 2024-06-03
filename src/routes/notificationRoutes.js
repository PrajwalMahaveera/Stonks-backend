const express = require('express');
const admin = require('../firebase');
const pool = require('../db'); // Assuming you have a db.js file for database connection
const router = express.Router();
const nodemailer = require('nodemailer'); // Example email package

// Configure your email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Endpoint to send notification
router.post('/send', async (req, res) => {
  const { userId, title, body } = req.body; // Assuming you're passing the userId of the person who triggers the notification

  try {
    // Get followers of the user
    const followersResult = await pool.query('SELECT follower_id FROM followers WHERE user_id = $1', [userId]);
    const followers = followersResult.rows;

    for (const follower of followers) {
      const followerId = follower.follower_id;

      // Check if follower is online
      const onlineResult = await pool.query('SELECT is_online, email FROM users WHERE id = $1', [followerId]);
      const { is_online, email } = onlineResult.rows[0];

      if (is_online) {
        // Get the follower's FCM token
        const fcmResult = await pool.query('SELECT fcm_token FROM fcm_tokens WHERE user_id = $1', [followerId]);
        const { fcm_token: fcmToken } = fcmResult.rows[0];

        // Create the notification payload
        const message = {
          notification: {
            title,
            body,
          },
          token: fcmToken,
        };

        // Send the notification
        await admin.messaging().send(message);
      } else {
        // Send an email
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: title,
          text: body,
        };

        await transporter.sendMail(mailOptions);
      }
    }

    res.json({ message: 'Notifications sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
