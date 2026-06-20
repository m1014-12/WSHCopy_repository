const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting global setup...');
  
  // Start a browser instance
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to start...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    const title = await page.title();
    console.log(`✅ Application is running with title: ${title}`);
    
    // You can add any global setup logic here
    // For example, creating test users, setting up test data, etc.
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;
