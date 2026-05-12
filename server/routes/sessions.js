const express = require('express');
const router = express.Router();
const supabase = require('../db')

// POST /sessions/start
router.post('/start', async (req, res) => {
  console.log('POST /sessions/start', req.body);
  const { userId, subject } = req.body;

  if (!userId || !subject) {
    return res.status(400).json({ error: 'userId and subject are required' });
  }

  const {data: alreadyActive, error} = await supabase
    .from('sessions')
    .select()
    .eq('user_id', userId)
    .eq('active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(error)
    return res.status(500).json({ error: 'Database error' })
  }

  if (alreadyActive) {
    return res.status(409).json({ error: 'User already has an active session' });
  }

  const { data: newSession, error: insertError } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      subject,
      start_time: new Date().toISOString(),
      end_time: null,
      duration: null,
      active: true,
    })
    .select()
    .single()

  if (insertError) {
    console.error(insertError)
    return res.status(500).json({ error: 'Database error' })
  }

  res.status(201).json({ message: 'Session started', session: newSession });
});

// POST /sessions/stop
router.post('/stop', (req, res) => {
  console.log('POST /sessions/stop', req.body);
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const session = sessions.find(s => s.userId === userId && s.active);
  if (!session) {
    return res.status(404).json({ error: 'No active session found for this user' });
  }

  session.endTime = new Date().toISOString();
  session.duration = Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000);
  session.active = false;

  res.json({ message: 'Session stopped', session });
});

// GET /sessions/:userId
router.get('/:userId', (req, res) => {
  console.log('GET /sessions/:userId', req.params.userId);
  const { userId } = req.params;

  const userSessions = sessions.filter(s => s.userId === userId);
  res.json({ sessions: userSessions });
});

module.exports = router;
