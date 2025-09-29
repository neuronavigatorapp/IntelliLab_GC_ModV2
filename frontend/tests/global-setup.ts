import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const apiURL = process.env.API_URL || 'http://localhost:8000';
  const frontendUrl = process.env.BASE_URL || 'http://localhost:5176';
  const isProductionTest = apiURL.includes('https://') || frontendUrl.includes('https://');

  // Test backend health
  try {
    const healthURL = `${apiURL}/api/health`;
    const response = await page.request.get(healthURL);
    if (!response.ok()) {
      if (isProductionTest) {
        console.log('⚠️ Backend not yet deployed, skipping health check');
      } else {
        throw new Error(`Backend health check failed: ${response.status()}`);
      }
    } else {
      console.log('✅ Backend health check passed');
    }
  } catch (error) {
    if (isProductionTest) {
      console.log('⚠️ Backend not accessible yet, will test after deployment');
    } else {
      console.error('❌ Backend health check failed:', error);
      throw error;
    }
  }

  // Test frontend availability
  try {
    await page.goto(frontendUrl);
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Frontend health check passed');
  } catch (error) {
    if (isProductionTest) {
      console.log('⚠️ Frontend not accessible yet, will test after deployment');
    } else {
      console.error('❌ Frontend health check failed:', error);
      throw error;
    }
  }

  await browser.close();
}

export default globalSetup;