import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    use: {baseURL: 'http://localhost:3000'},
    webServer: {
        command: 'node index.js',
        cwd: './server',
        //so that dotenv finds /.env
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    },
});
