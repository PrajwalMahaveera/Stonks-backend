const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const passport = require('passport');
//const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const channelsRouter = require('./routes/channels');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(passport.initialize());
const httpServer = http.createServer(app);
const io = socketIo(httpServer);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle chat messages
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    // Broadcast message to all connected clients
    io.emit('chat message', msg);
  });

  // // To handle incoming messages
  // socket.on('message', (data) => {
  //   console.log('Received message:', data);
  // });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/follow', followRoutes);
app.use('/notifications', notificationRoutes);
app.use('/channels', channelsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

