import {test, expect, request} from '@playwright/test';

const apiBase = 'http://localhost:3000';
const username = `e2e_${Date.now()}`;
const password = 'Test123!';
const name = 'E2E User';

test.describe.configure({mode: 'serial'});

test('registers a new user', async ({page}) => {
test.setTimeout(60_000);
await page.goto('/');
await page.getByText('Register').click();
//Gets into register tab
await page.getByPlaceholder('Full name').fill(name);
await page.getByPlaceholder('Username').fill(username);
await page.getByPlaceholder('Password').fill(password);
await page.getByText('Create account').click();

await expect(page.getByText(/Hey,/)).toBeVisible();
//user authenticated, accesses Home page
});

test('logs in with registered user', async ({page}) =>{
await page.goto('/');
await page.getByPlaceholder('Username').fill(username);
await page.getByPlaceholder('Password').fill(password);
await page.getByText('Log in').last().click();

await expect(page.getByText(/Hey,/)).toBeVisible();
});

test('rejects login if using wrong password', async ({page})=> {
await page.goto('/');
await page.getByPlaceholder('Username').fill(username);
await page.getByPlaceholder('Password').fill('Wrongpassword123!');

//assert we stay on login screen since react native doesn't alert failures
const loginResponse = page.waitForResponse((r)=>r.url().includes('/auth/login'));
await page.getByText('Log in').last().click();
expect((await loginResponse).status()).toBe(401);

await expect(page.getByText(/Hey,/)).toHaveCount(0);
await expect(page.getByPlaceholder('Username')).toBeVisible();
});

//BELOW IS WIP, WAITING FOR TREVOR AND ANDREW'S FINALIZATION.

// test('starts and ends study session thru UI',
//     async({page})=>{
//         test.setTimeout(60_000);
//     const sessionUser = `e2e_sess_${Date.now()}`;
//     const api = await request.newContext({baseURL: API_BASE});
//     await api.post('/auth/register', {data: {username: sessionUser, password, name}});
//     const{token}=await(await api.post('/auth/login',
//         {data: {username: sessionUser, password}})).json();

//     await api.put('/profile/classes', {
//         headers: {Authorizaton: `Bearer ${token}`},
//         data: {classes: ['CS 35L']},
// });
// await api.dispose();
// await page.goto('/');
// await page.getByPlaceholder('Username').fill(sessionUser);
// await page.getByPlaceholder('Password').fill(password);
// await page.getByText('Log in').last().click();

// await expect(page.getByText(/Hey,/)).toBeVisible();
// await page.getByText('Start Study Session').click();
// await page.getByPlaceholder('What are you studying').fill('CS 35L');

//     });