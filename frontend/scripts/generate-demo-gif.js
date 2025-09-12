const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateDemoGif() {
  console.log('🎬 Starting IntelliLab GC Demo GIF Generation...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport for consistent recording
  await page.setViewport({ width: 1280, height: 720 });
  
  // Navigate to the app
  console.log('📱 Navigating to IntelliLab GC...');
  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });

  // Wait for the app to load
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
  console.log('✅ Dashboard loaded');

  // Start recording (this would need a screen recording tool in practice)
  console.log('🎥 Starting demo flow...');
  
  // Step 1: Dashboard - Click "Try Live Chromatogram Demo"
  console.log('1️⃣ Clicking "Try Live Chromatogram Demo" button...');
  await page.waitForSelector('button:has-text("Try Live Chromatogram Demo")', { timeout: 5000 });
  await page.click('button:has-text("Try Live Chromatogram Demo")');
  await page.waitForTimeout(1000);

  // Step 2: Demo page - Select mixture
  console.log('2️⃣ Selecting methane/ethane mixture...');
  await page.waitForSelector('text=Methane/Ethane', { timeout: 5000 });
  await page.click('text=Methane/Ethane');
  await page.waitForTimeout(500);
  
  // Click Next Step
  await page.click('button:has-text("Next Step")');
  await page.waitForTimeout(1000);

  // Step 3: Choose default ramp
  console.log('3️⃣ Choosing default oven ramp...');
  await page.waitForSelector('input[type="radio"]', { timeout: 5000 });
  await page.click('input[type="radio"]');
  await page.waitForTimeout(500);
  
  // Start simulation
  await page.click('button:has-text("Start Simulation")');
  await page.waitForTimeout(2000);

  // Step 4: Watch the animation
  console.log('4️⃣ Watching chromatogram animation...');
  await page.waitForTimeout(3000);

  // Step 5: Navigate to Detection Limit
  console.log('5️⃣ Navigating to Detection Limit Calculator...');
  await page.click('button:has-text("Try Detection Limit Calculator")');
  await page.waitForTimeout(1000);

  // Step 6: Fill example values
  console.log('6️⃣ Filling example values...');
  await page.waitForSelector('input[placeholder*="signal intensity"]', { timeout: 5000 });
  
  // Fill form with example values
  await page.type('input[placeholder*="signal intensity"]', '1000');
  await page.type('input[placeholder*="noise level"]', '50');
  await page.type('input[placeholder*="concentration"]', '10');
  await page.type('input[placeholder*="injection volume"]', '1');
  
  await page.waitForTimeout(1000);

  // Step 7: Calculate
  console.log('7️⃣ Calculating detection limit...');
  await page.click('button:has-text("Calculate Detection Limit")');
  await page.waitForTimeout(2000);

  // Step 8: Return to Dashboard
  console.log('8️⃣ Returning to Dashboard...');
  await page.click('text=Dashboard');
  await page.waitForTimeout(1000);

  console.log('✅ Demo flow completed!');
  
  // In a real implementation, you would:
  // 1. Use a screen recording tool like FFmpeg
  // 2. Capture the browser window during the demo
  // 3. Convert the recording to GIF format
  // 4. Save to public/intellilab_demo.gif
  
  // For now, we'll create a placeholder
  const gifPath = path.join(__dirname, '../public/intellilab_demo.gif');
  const placeholderContent = 'Demo GIF placeholder - would contain 8-12 second animated demo';
  
  // Ensure public directory exists
  const publicDir = path.dirname(gifPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(gifPath, placeholderContent);
  console.log(`📁 Demo GIF placeholder created at: ${gifPath}`);
  
  await browser.close();
  console.log('🎉 Demo GIF generation completed!');
}

// Run the demo generation
generateDemoGif().catch(console.error);