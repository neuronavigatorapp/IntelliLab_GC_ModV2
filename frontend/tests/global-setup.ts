import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test backend health
  try {
    const response = await page.request.get('http://localhost:8000/api/health');
    if (!response.ok()) {
      throw new Error(`Backend health check failed: ${response.status()}`);
    }
    console.log('✅ Backend health check passed');
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    throw error;
  }

  // Test frontend availability
  const frontendUrl = process.env.BASE_URL || 'http://localhost:5176';
  try {
    await page.goto(frontendUrl);
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Frontend health check passed');
  } catch (error) {
    console.error('❌ Frontend health check failed:', error);
    throw error;
  }

  await browser.close();
}

export default globalSetup;