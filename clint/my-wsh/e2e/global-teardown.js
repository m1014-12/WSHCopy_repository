const { chromium } = require('@playwright/test');

async function globalTeardown() {
  console.log('🧹 Starting global teardown...');
  
  // Start a browser instance for cleanup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // You can add any global cleanup logic here
    // For example, cleaning up test data, removing test users, etc.
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

module.exports = globalTeardown;
