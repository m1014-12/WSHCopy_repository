// Helper functions for E2E tests
const { expect } = require('@playwright/test');

/**
 * Fill login form with provided credentials
 */
async function fillLoginForm(page, email, password) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
}

/**
 * Fill registration form with provided data
 */
async function fillRegistrationForm(page, userData) {
  await page.fill('input[id="username"]', userData.username);
  await page.fill('input[id="email"]', userData.email);
  await page.fill('input[id="phoneNumber"]', userData.phoneNumber);
  await page.fill('input[id="password"]', userData.password);
  await page.fill('input[id="confirmPassword"]', userData.confirmPassword || userData.password);
}

/**
 * Fill admin login form
 */
async function fillAdminLoginForm(page, adminData) {
  await page.fill('input[id="accessName"]', adminData.accessName);
  await page.fill('input[id="adminPassword"]', adminData.password);
  await page.fill('input[id="adminKey"]', adminData.adminKey);
}

/**
 * Wait for alert dialog and get its message
 */
async function getAlertMessage(page) {
  return new Promise((resolve) => {
    page.on('dialog', async dialog => {
      resolve(dialog.message());
      await dialog.accept();
    });
  });
}

/**
 * Check if element has specific class
 */
async function hasClass(page, selector, className) {
  const element = await page.locator(selector);
  const classes = await element.getAttribute('class');
  return classes ? classes.includes(className) : false;
}

/**
 * Wait for page to be fully loaded
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('body');
}

/**
 * Take screenshot with timestamp
 */
async function takeTimestampedScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check password requirements validation
 */
async function checkPasswordRequirements(page, password) {
  const requirements = {
    minLength: password.length >= 8,
    maxLength: password.length <= 20,
    upperCase: /[A-Z]/.test(password),
    lowerCase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[\W_]/.test(password)
  };

  for (const [requirement, isValid] of Object.entries(requirements)) {
    const selector = `li:has-text("${requirement}")`;
    const element = page.locator(selector);
    const hasValidClass = await hasClass(page, selector, 'valid');
    expect(hasValidClass).toBe(isValid);
  }
}

/**
 * Mock API responses for testing
 */
async function mockApiResponse(page, endpoint, response) {
  await page.route(`**/api${endpoint}`, route => {
    route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      body: JSON.stringify(response.data)
    });
  });
}

/**
 * Clear all form fields
 */
async function clearAllFormFields(page) {
  const inputs = await page.locator('input').all();
  for (const input of inputs) {
    await input.clear();
  }
}

/**
 * Check if user is logged in (check for user-specific elements)
 */
async function isLoggedIn(page) {
  try {
    // Look for elements that indicate user is logged in
    const userElements = [
      '[data-testid="user-menu"]',
      '[data-testid="logout-button"]',
      'a[href="/profile"]',
      '.user-header'
    ];
    
    for (const selector of userElements) {
      if (await page.locator(selector).count() > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if admin is logged in
 */
async function isAdminLoggedIn(page) {
  try {
    const adminElements = [
      '[data-testid="admin-menu"]',
      '[data-testid="admin-dashboard"]',
      'a[href="/admin-home"]'
    ];
    
    for (const selector of adminElements) {
      if (await page.locator(selector).count() > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

module.exports = {
  fillLoginForm,
  fillRegistrationForm,
  fillAdminLoginForm,
  getAlertMessage,
  hasClass,
  waitForPageLoad,
  takeTimestampedScreenshot,
  checkPasswordRequirements,
  mockApiResponse,
  clearAllFormFields,
  isLoggedIn,
  isAdminLoggedIn
};
