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


test('starts and ends study session thru UI',
    async({page})=>{
        test.setTimeout(60_000);

//log in as already-registered user from first test
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByText('Log in').last().click();
    await expect(page.getByText(/Hey,/)).toBeVisible();
    
//add a class to profile

    await page.getByText('Edit').first().click();
    await page.getByPlaceholder('Add a class').fill('CS 35L');

    const classSaved = page.waitForResponse((r)=>r.url().includes('/profile/classes') && r.request().method()==='PUT');
    await page.getByText('Add', {exact: true}).click();
    await classSaved; //make sure class actually saves

//start a session
    await page.getByText('Start Study Session').click();
    await expect(page.getByText('What are you studying?')).toBeVisible();
    const modalCard = page.locator('div')
    .filter({hasText: 'What are you studying?'})
    .filter({hasText: 'CS 35L'})
    .last();
    await modalCard.getByText('CS 35L').click();
    await expect(page.getByText(/Studying:/)).toBeVisible();
    await page.waitForTimeout(2000); //studies for a bit

    //end the sesh
    await page.getByText('End Session').click();
    await page.getByText('Save Session').click();
    await expect(page.getByText('Start Study Session')).toBeVisible();
    });