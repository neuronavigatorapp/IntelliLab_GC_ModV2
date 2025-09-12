const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateDemoGif() {
  console.log('🚀 Starting IntelliLab GC Demo GIF generation...');
  
  const browser = await puppeteer.launch({
    headless: false, // We need to see the browser for screenshots
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    console.log('📱 Navigating to the application...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for the app to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });

    const screenshots = [];
    const screenshotDir = path.join(__dirname, '../public/demo-screenshots');
    
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Step 1: Dashboard
    console.log('📸 Taking screenshot 1: Dashboard');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-dashboard.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '01-dashboard.png'));

    // Click on "Try Live Chromatogram Demo"
    console.log('🖱️ Clicking on Live Chromatogram Demo...');
    await page.click('button:has-text("Try Live Chromatogram Demo")');
    await page.waitForTimeout(2000);

    // Step 2: Demo page
    console.log('📸 Taking screenshot 2: Demo Page');
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-demo-page.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '02-demo-page.png'));

    // Select a mixture
    console.log('🖱️ Selecting BTX Mix...');
    await page.click('text=BTX Mix');
    await page.waitForTimeout(1000);

    // Click Next Step
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(2000);

    // Step 3: Ramp configuration
    console.log('📸 Taking screenshot 3: Ramp Configuration');
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-ramp-config.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '03-ramp-config.png'));

    // Start simulation
    console.log('🖱️ Starting simulation...');
    await page.click('button:has-text("Start Simulation")');
    await page.waitForTimeout(3000);

    // Step 4: Live chromatogram
    console.log('📸 Taking screenshot 4: Live Chromatogram');
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-chromatogram.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '04-chromatogram.png'));

    // Navigate to Detection Limit
    console.log('🖱️ Navigating to Detection Limit...');
    await page.click('button:has-text("Try Detection Limit Calculator")');
    await page.waitForTimeout(2000);

    // Fill in some values
    console.log('📝 Filling in detection limit values...');
    await page.type('input[placeholder*="signal intensity"]', '1000');
    await page.type('input[placeholder*="noise level"]', '50');
    await page.type('input[placeholder*="concentration"]', '10');
    await page.type('input[placeholder*="injection volume"]', '1');
    await page.waitForTimeout(1000);

    // Step 5: Detection Limit form
    console.log('📸 Taking screenshot 5: Detection Limit Form');
    await page.screenshot({ 
      path: path.join(screenshotDir, '05-detection-form.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '05-detection-form.png'));

    // Calculate
    console.log('🖱️ Calculating detection limit...');
    await page.click('button:has-text("Calculate Detection Limit")');
    await page.waitForTimeout(3000);

    // Step 6: Results
    console.log('📸 Taking screenshot 6: Results');
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-results.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '06-results.png'));

    // Navigate back to dashboard
    console.log('🖱️ Navigating back to dashboard...');
    await page.click('text=Dashboard');
    await page.waitForTimeout(2000);

    // Step 7: Final dashboard
    console.log('📸 Taking screenshot 7: Final Dashboard');
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-final-dashboard.png'),
      fullPage: true 
    });
    screenshots.push(path.join(screenshotDir, '07-final-dashboard.png'));

    console.log('✅ Screenshots captured successfully!');
    console.log('📁 Screenshots saved to:', screenshotDir);
    console.log('🎬 To create GIF, run: ffmpeg -framerate 1 -i demo-screenshots/%02d-*.png -vf "scale=1280:720" intellilab_demo.gif');

  } catch (error) {
    console.error('❌ Error during demo generation:', error);
  } finally {
    await browser.close();
  }
}

// Check if the development server is running
async function checkServer() {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { timeout: 5000 });
    await browser.close();
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Development server is not running on http://localhost:3000');
    console.log('💡 Please start the development server first: npm start');
    process.exit(1);
  }

  console.log('✅ Development server is running');
  await generateDemoGif();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateDemoGif };
