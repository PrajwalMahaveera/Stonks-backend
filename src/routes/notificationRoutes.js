// notificationRoutes.js
const express = require('express');
const admin = require('../firebase');
const router = express.Router();

// Endpoint to send notification
router.post('/send', async (req, res) => {
  const { title, body } = req.body;

  try {
    // Simulate FCM token for testing purposes
    const fcmToken = 'test_fcm_token';

    // Create the notification payload
    const message = {
      notification: {
        title,
        body,
      },
      token: fcmToken,
    };

    // Send the notification
    const response = await admin.messaging().send(message);
    res.json({ message: 'Notification sent successfully', response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
