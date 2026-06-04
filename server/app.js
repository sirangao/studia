const express = require('express');
const app = express();
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if(req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.static(require('path').join(__dirname, 'public')));

const authRoutes = require('./routes/auth');
const sessionsRoutes = require('./routes/sessions');
const friendsRoutes = require('./routes/friends');
const requireAuth = require('./middleware/requireAuth');
const profileRoutes = require('./routes/profile');

app.use('/profile', requireAuth, profileRoutes);
app.use('/auth', authRoutes);
app.use('/sessions', requireAuth, sessionsRoutes);
app.use('/friends', requireAuth, friendsRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
