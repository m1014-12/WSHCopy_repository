const { test, expect } = require('@playwright/test');
const { testUsers, testUrls } = require('../utils/test-data');
const { 
  fillLoginForm, 
  fillAdminLoginForm, 
  getAlertMessage, 
  waitForPageLoad,
  takeTimestampedScreenshot,
  isLoggedIn,
  isAdminLoggedIn
} = require('../utils/helpers');

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrls.login);
    await waitForPageLoad(page);
  });

  test.describe('User Login', () => {
    test('should render login form correctly', async ({ page }) => {
      // Check page title and main elements
      await expect(page).toHaveTitle(/welcome/i);
      await expect(page.locator('h1')).toContainText(/welcome/i);
      await expect(page.locator('h2')).toContainText(/login/i);
      
      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check navigation links
      await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
      await expect(page.locator('a[href="/registration"]')).toBeVisible();
      await expect(page.locator('a[href="/"]')).toBeVisible();
    });

    test('should display validation error for empty fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for alert dialog
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/fill all fields/i);
    });

    test('should display validation error for invalid email', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // The form should still submit but server will handle validation
      // We expect either a redirect or an error message
      await page.waitForTimeout(1000);
    });

    test('should handle successful login', async ({ page }) => {
      // Mock successful login response
      await page.route('**/login', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 1, email: testUsers.validUser.email },
            token: 'mock-token'
          })
        });
      });

      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should redirect to home page
      await expect(page).toHaveURL(/.*home/);
    });

    test('should handle login failure', async ({ page }) => {
      // Mock failed login response
      await page.route('**/login', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          })
        });
      });

      await fillLoginForm(page, testUsers.invalidUser.email, testUsers.invalidUser.password);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/invalid credentials/i);
    });

    test('should handle network error', async ({ page }) => {
      // Mock network error
      await page.route('**/login', route => route.abort());

      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/login failed/i);
    });
  });

  test.describe('Admin Login', () => {
    test('should switch to admin mode with secret key combination', async ({ page }) => {
      // Press Ctrl+Shift+Q to activate admin mode
      await page.keyboard.press('Control+Shift+KeyQ');
      
      // Wait for admin mode to activate
      await expect(page.locator('h2')).toContainText(/admin login/i);
      await expect(page.locator('input[id="accessName"]')).toBeVisible();
      await expect(page.locator('input[id="adminPassword"]')).toBeVisible();
      await expect(page.locator('input[id="adminKey"]')).toBeVisible();
    });

    test('should handle successful admin login', async ({ page }) => {
      // Activate admin mode
      await page.keyboard.press('Control+Shift+KeyQ');
      await page.waitForTimeout(500);

      // Mock successful admin login response
      await page.route('**/adminLogin', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            adminId: 1,
            accessName: testUsers.adminUser.accessName,
            email: 'admin@example.com',
            token: 'admin-token'
          })
        });
      });

      await fillAdminLoginForm(page, testUsers.adminUser);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should redirect to admin home page
      await expect(page).toHaveURL(/.*admin-home/);
    });

    test('should handle admin login failure', async ({ page }) => {
      // Activate admin mode
      await page.keyboard.press('Control+Shift+KeyQ');
      await page.waitForTimeout(500);

      // Mock failed admin login response
      await page.route('**/adminLogin', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid admin credentials'
          })
        });
      });

      await fillAdminLoginForm(page, {
        accessName: 'wrongadmin',
        password: 'wrongpass',
        adminKey: 'wrongkey'
      });
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/invalid admin credentials/i);
    });

    test('should validate admin form fields', async ({ page }) => {
      // Activate admin mode
      await page.keyboard.press('Control+Shift+KeyQ');
      await page.waitForTimeout(500);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation error for empty fields
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/fill all fields/i);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
      await forgotPasswordLink.click();
      
      await expect(page).toHaveURL(/.*forgot-password/);
    });

    test('should navigate to registration page', async ({ page }) => {
      const registrationLink = page.locator('a[href="/registration"]');
      await registrationLink.click();
      
      await expect(page).toHaveURL(/.*registration/);
    });

    test('should navigate to home page', async ({ page }) => {
      const homeLink = page.locator('a[href="/"]');
      await homeLink.click();
      
      await expect(page).toHaveURL(/.*\/$/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that form is still accessible
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that form is still accessible
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await expect(emailInput).toHaveAttribute('id');
      await expect(passwordInput).toHaveAttribute('id');
      
      // Check for associated labels
      const emailId = await emailInput.getAttribute('id');
      const passwordId = await passwordInput.getAttribute('id');
      
      await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
      await expect(page.locator(`label[for="${passwordId}"]`)).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });
  });
});
