import {test, expect} from '@playwright/test';

const username = `e2e_${Date.now()}`;
const password = 'Test123';
const name = 'E2E User';

test.describe.configure({mode: 'serial'});

test('registers a new user, gets token', async ({page}) => {
await page.goto('/');
await page.fill('#reg-username', username);
await page.fill('#reg-password', password);
await page.fill('#reg-name', name);
await page.click('#btn-register');

const res = page.locator('#res-register');
await expect(res).toBeVisible();
await expect(res).toContainText('User registered');
await expect(res).toContainText('"token"');
});

test('logs in with previously established user', async ({page}) =>{
await page.goto('/');
await page.fill('#login-username', username);
await page.fill('#login-password', password);
await page.click('#btn-login');

const res = page.locator('#res-login');
await expect(res).toBeVisible();
await expect(res).toContainText('Login successful');
await expect(res).toContainText('"token"');
});


test('starts a session, waits 30 seconds, then ends session', async ({request}) =>{
    test.setTimeout(60_000);
const uName = `playWright_test_${Date.now()}`;
//gets token, logs in
await request.post('/auth/register',
    {data: {username: uName, password: 'Test123', name: 'PlaywrightTest'
}});
const {token} = await(await request.post('/auth/login',
    {data: {username: uName, password: 'Test123'}})).json();
const auth = {Authorization: `Bearer ${token}`};

//puts student in the class so they can access session for it
await request.put('/profile/classes', {headers: auth, data: {classes: ['CS35L']}});

//start session
const startSession = await request.post('/sessions/start', {
    headers: auth, data: {subject: 'CS35L'}});
    expect(startSession.status()).toBe(201);
const started = await startSession.json();
    expect(started.message).toBe('Session started');
    expect(started.session.active).toBe(true);

//study for 30sec
await new Promise(resolve => setTimeout(resolve, 30_000));

//stop session
const stopSession = await request.post('/sessions/stop', {
    headers: auth});
    expect(stopSession.status()).toBe(200);
    const stopped = await stopSession.json();
    expect(stopped.message).toBe('Session stopped');
    expect(stopped.updatedSession.active).toBe(false);
    expect(stopped.updatedSession.duration).toBeGreaterThanOrEqual(29); //seconds
});

test('rejects login if using wrong password', async ({page})=> {
await page.goto('/');
await page.fill('#login-username', username);
await page.fill('#login-password', 'wrongPassword123');
await page.click('#btn-login');

const res = page.locator('#res-login');
await expect(res).toBeVisible();
await expect(res).toContainText('Invalid credentials');
});