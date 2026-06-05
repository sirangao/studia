import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    use: {baseURL: 'http://localhost:8081', 
    },
    webServer: [
        {
        command: 'node index.js',
        cwd: './server',
        //so that dotenv finds /.env
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        env: {USE_FAKE_DB: '1'},
        },
        {
            command: 'npx expo start --web --port 8081',
            cwd: './frontend',
            url: 'http://localhost:8081',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: {EXPO_PUBLIC_API_URL: 'http://localhost:3000'},
    },
],
});

