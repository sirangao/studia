const request = require('supertest');
const app = require('../app');

let token1, token2, userId1, userId2

beforeAll(async () => {
  const res1 = await request(app)
    .post('/auth/login')
    .send({ username: 'alice', password: 'pass123' })
  token1 = res1.body.token
  userId1 = res1.body.user.id

  const res2 = await request(app)
    .post('/auth/login')
    .send({ username: 'bob', password: 'pass123' })
  token2 = res2.body.token
  userId2 = res2.body.user.id

  // clean up any leftover active sessions from previous runs
  await request(app).post('/sessions/stop').set('Authorization', `Bearer ${token1}`)
  await request(app).post('/sessions/stop').set('Authorization', `Bearer ${token2}`)

  // give bob an active session so the 409 test is reliable
  await request(app).post('/sessions/start').set('Authorization', `Bearer ${token2}`).send({ subject: 'Biology' })
})

afterAll(async () => {
  await request(app).post('/sessions/stop').set('Authorization', `Bearer ${token1}`)
  await request(app).post('/sessions/stop').set('Authorization', `Bearer ${token2}`)
})

describe('POST /sessions/start', () => {
  test('starts a session for a user with no active session', async () => {
    const res = await request(app)
      .post('/sessions/start')
      .set('Authorization', `Bearer ${token1}`)
      .send({ subject: 'Chemistry' });

    expect(res.statusCode).toBe(201);
    expect(res.body.session.active).toBe(true);
    expect(res.body.session.subject).toBe('Chemistry');
  });

  test('returns 409 when user already has an active session', async () => {
    const res = await request(app)
      .post('/sessions/start')
      .set('Authorization', `Bearer ${token2}`)
      .send({ subject: 'Biology' });

    expect(res.statusCode).toBe(409);
  });

  test('returns 400 when subject is missing', async () => {
    const res = await request(app)
      .post('/sessions/start')
      .set('Authorization', `Bearer ${token1}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /sessions/stop', () => {
  test('stops an active session', async () => {
    const res = await request(app)
      .post('/sessions/stop')
      .set('Authorization', `Bearer ${token2}`)

    expect(res.statusCode).toBe(200);
    expect(res.body.updatedSession.active).toBe(false);
    expect(res.body.updatedSession.endTime).not.toBeNull();
  });

  test('returns 404 when user has no active session', async () => {
    const res = await request(app)
      .post('/sessions/stop')
      .set('Authorization', `Bearer ${token2}`)

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /sessions/:userId', () => {
  test('returns sessions for a user', async () => {
    const res = await request(app)
      .get(`/sessions/${userId1}`)
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThan(0);
  });

  test('returns 403 when accessing another users sessions', async () => {
    const res = await request(app)
      .get(`/sessions/${userId2}`)
      .set('Authorization', `Bearer ${token1}`)

    expect(res.statusCode).toBe(403);
  });
});
