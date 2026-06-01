const request = require('supertest');
const app = require('../app');
const supabase = require('../db');

let token1, token2, userId1, userId2

beforeAll(async () => {
  const [res1, res2] = await Promise.all([
    request(app).post('/auth/login').send({ username: 'alice', password: 'pass123' }),
    request(app).post('/auth/login').send({ username: 'bob', password: 'pass123' }),
  ])
  token1 = res1.body.token; userId1 = res1.body.user.id
  token2 = res2.body.token; userId2 = res2.body.user.id

  // clean up any leftover alice-bob friendship from previous runs
  const low = Math.min(userId1, userId2)
  const high = Math.max(userId1, userId2)
  await supabase.from('friendships').delete().eq('user_id_low', low).eq('user_id_high', high)
})

describe('GET /friends/search', () => {
  test('finds users matching the search query', async () => {
    const res = await request(app)
      .get('/friends/search?username=ali')
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].username).toBe('alice');
  });

  test('returns 400 when username param is missing', async () => {
    const res = await request(app)
      .get('/friends/search')
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(400);
  });

  test('returns empty array when no users match', async () => {
    const res = await request(app)
      .get('/friends/search?username=zzznomatch')
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(0);
  });
});

describe('POST /friends/add', () => {
  test('adds a new friend successfully', async () => {
    const res = await request(app)
      .post('/friends/add')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: userId2 });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Friend added');
  });

  test('returns 409 when request already pending', async () => {
    const res = await request(app)
      .post('/friends/add')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: userId2 });

    expect(res.statusCode).toBe(409);
  });

  test('returns 400 when adding yourself', async () => {
    const res = await request(app)
      .post('/friends/add')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: userId1 });

    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when friend does not exist', async () => {
    const res = await request(app)
      .post('/friends/add')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: 99999 });

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /friends/accept', () => {
  test('accepts a pending friend request', async () => {
    const res = await request(app)
      .post('/friends/accept')
      .set('Authorization', `Bearer ${token2}`)
      .send({ friendId: userId1 });

    expect(res.statusCode).toBe(200);
  });
});

describe('GET /friends/:userId', () => {
  test('returns friends list for a user', async () => {
    const res = await request(app)
      .get(`/friends/${userId1}`)
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.friends)).toBe(true);
    expect(res.body.friends.length).toBeGreaterThan(0);
  });

  test('returns 403 when accessing another users friends', async () => {
    const res = await request(app)
      .get(`/friends/${userId2}`)
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(403);
  });
});
