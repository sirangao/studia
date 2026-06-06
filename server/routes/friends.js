const express = require('express');
const router = express.Router();
const userRepo = require('../repositories/userRepository')
const friendshipRepo = require('../repositories/friendshipRepository');
const sessionRepo = require('../repositories/sessionRepository');
const { validateUsername } = require('../middleware/sanitize');

// GET /friends/search?username=xxx
router.get('/search', async (req, res) => {
  console.log('GET /friends/search', req.query);
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'username query param is required' });
  }

  if (!validateUsername(username)) {
    return res.status(400).json({ error: 'username may only contain letters, numbers, underscores, and hyphens' });
  }

  try {
    const results = await userRepo.searchByUsername(username)
    res.json({ users: results })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
});

// POST /friends/add
router.post('/add', async (req, res) => {
  console.log('POST /friends/add', req.body);
  const userId = req.user.id;
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }

  if (userId === friendId) {
    return res.status(400).json({ error: 'Cannot add yourself as a friend' });
  }

  try {
    const friendExists = await userRepo.findById(friendId)
    if (!friendExists) return res.status(404).json({ error: 'User not found' })

    const existingRequest = await friendshipRepo.findByPair(userId, friendId)
    if (existingRequest) {
      if (existingRequest.status === 'accepted') return res.status(409).json({ error: 'Already friends' })
      return res.status(409).json({ error: 'Friend request already pending' })
    }

    const friendship = await friendshipRepo.create(userId, friendId)
    res.status(201).json({ message: 'Friend added', friendship })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
});

// GET /friends/requests
router.get('/requests', async(req, res) => {
  const userId = req.user.id;
  try{
    const requests = await friendshipRepo.findFriendRequests(userId);
    const requestIds = requests.map(r => r.requester_id);
    const requesters = await userRepo.findManyByIds(requestIds);
    res.json({requests: requesters});
  }
  catch(err){
    console.error(err);
    return res.status(500).json({error: 'Database error'});
  }
});

// GET /friends/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.userId;

  try{
    const [friend, friendship, friendsOfFriend] = await Promise.all([ 
      userRepo.findById(friendId),
      friendshipRepo.findByPair(userId, friendId),
      friendshipRepo.findAcceptedByUserId(friendId),
    ]);
    if(!friend)
      return res.status(400).json({error: 'Friend ID not found'}); 
    const {password: _, ...safeUser} = friend;
   
    res.json({user: safeUser, status: friendship?.status || null, 
      isRequester: friendship ? Number(friendship.requester_id) === Number(userId) : false, 
      friendCount: friendsOfFriend.length
    });
  }
  catch(err){
    console.error(err);
    return res.status(500).json({error: 'Database error'});
  }
})

// POST /friends/accept
router.post('/accept', async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }

  if (userId === friendId) {
    return res.status(400).json({ error: 'Cannot accept your own request' });
  }

  try {
    const request = await friendshipRepo.findPendingByPair(userId, friendId)
    if (!request || request.status !== 'pending') return res.status(404).json({ error: 'Pending request not found' })
    
    if(Number(request.requester_id) === Number(userId))
      return res.status(400).json({error: 'Cannot accept your own request'})

    const friendship = await friendshipRepo.accept(userId, friendId)
    res.json({ friendship })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
});

// POST /friends/decline
router.post('/decline', async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;
  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }

  try{
    const request = await friendshipRepo.findPendingByPair(userId, friendId);
    if (!request || request.status !== 'pending') return res.status(404).json({ error: 'Pending request not found' })
    if(Number(request.requester_id) === Number(userId))
      return res.status(400).json({error: 'Cannot decline your own request'})
    
    await friendshipRepo.deleteFriendship(userId, friendId);
    res.json({message: 'Friend request declined'});
  }
  catch(err){
    console.error(err);
    return res.status(500).json({error: 'Database error'});
  }
});

// POST /friends/remove
router.post('/remove', async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ error: 'friendId is required' });

  try {
    const friendship = await friendshipRepo.findByPair(userId, friendId);
    if (!friendship || friendship.status !== 'accepted')
      return res.status(404).json({ error: 'Friendship not found' });

    await friendshipRepo.deleteFriendship(userId, friendId);
    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /friends/acceptances
router.get('/acceptances', async (req, res) => {
  const userId = req.user.id;
  try {
    const acceptances = await friendshipRepo.findAcceptedRequestsByUserId(userId)
    const friendIds = acceptances.map(f =>
      f.user_id_low === userId ? f.user_id_high : f.user_id_low
    )
    const users = await userRepo.findManyByIds(friendIds)
    res.json({ acceptances: users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
});

// GET /friends/:userId
router.get('/:userId', async (req, res) => {
  console.log('GET /friends/:userId', req.params.userId);
  const { userId } = req.params;
  if (parseInt(userId) !==req.user.id) {
    return res.status(403).json({error: "Cannot view another user's friends"})
  }
  try {
    const friendships = await friendshipRepo.findAcceptedByUserId(userId)
    const friendIds = friendships.map(f =>
      f.user_id_low === parseInt(userId) ? f.user_id_high : f.user_id_low
    )
    const friends = await userRepo.findManyByIds(friendIds)
    const friendsWithHours = await Promise.all(
      friends.map(async (f) => ({
        ...f,
        hoursStudied: await sessionRepo.findWeeklyDurationByUserId(f.id)
      }))
    )
    res.json({ friends: friendsWithHours })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
});

module.exports = router;
