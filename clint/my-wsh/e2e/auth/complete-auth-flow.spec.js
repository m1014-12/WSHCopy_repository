const { test, expect } = require('@playwright/test');
const { testUsers, testUrls } = require('../utils/test-data');
const { 
  fillLoginForm, 
  fillRegistrationForm, 
  getAlertMessage, 
  waitForPageLoad,
  isLoggedIn,
  isAdminLoggedIn
} = require('../utils/helpers');

test.describe('Complete Authentication Flow', () => {
  test.describe('User Registration to Login Flow', () => {
    test('should complete full user registration and login flow', async ({ page }) => {
      // Step 1: Navigate to registration page
      await page.goto(testUrls.registration);
      await waitForPageLoad(page);

      // Step 2: Fill registration form
      await fillRegistrationForm(page, testUsers.validUser);
      
      // Mock successful registration
      await page.route('**/userRegister', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration successful',
            user: { id: 1, email: testUsers.validUser.email }
          })
        });
      });

      // Step 3: Submit registration
      const registerButton = page.locator('button[type="submit"]');
      await registerButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);

      // Step 4: Fill login form
      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
      // Mock successful login
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

      // Step 5: Submit login
      const loginButton = page.locator('button[type="submit"]');
      await loginButton.click();

      // Should redirect to home page
      await expect(page).toHaveURL(/.*home/);
    });

    test('should handle registration failure and retry', async ({ page }) => {
      // Navigate to registration page
      await page.goto(testUrls.registration);
      await waitForPageLoad(page);

      // Fill registration form with existing email
      await fillRegistrationForm(page, {
        ...testUsers.validUser,
        email: 'existing@example.com'
      });
      
      // Mock registration failure
      await page.route('**/userRegister', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Email already exists'
          })
        });
      });

      // Submit registration
      const registerButton = page.locator('button[type="submit"]');
      await registerButton.click();

      // Should show error message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/email already exists/i);

      // Fix email and retry
      await page.fill('input[id="email"]', 'newuser@example.com');
      
      // Mock successful registration
      await page.route('**/userRegister', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration successful'
          })
        });
      });

      await registerButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Forgot Password Flow', () => {
    test('should complete forgot password flow', async ({ page }) => {
      // Step 1: Navigate to login page
      await page.goto(testUrls.login);
      await waitForPageLoad(page);

      // Step 2: Click forgot password link
      const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
      await forgotPasswordLink.click();
      
      await expect(page).toHaveURL(/.*forgot-password/);

      // Step 3: Fill forgot password form
      await page.fill('input[type="email"]', testUsers.validUser.email);
      
      // Mock successful password reset request
      await page.route('**/forgot-password', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset link sent to your email'
          })
        });
      });

      // Step 4: Submit forgot password form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show success message
      await expect(page.locator('.message')).toContainText(/password reset link sent/i);

      // Step 5: Navigate to reset password page (simulating email link click)
      await page.goto(testUrls.resetPassword);
      await waitForPageLoad(page);

      // Step 6: Fill reset password form
      const newPassword = 'NewPassword123!';
      await page.fill('input[id="password"]', newPassword);
      await page.fill('input[id="confirmPassword"]', newPassword);
      
      // Mock successful password reset
      await page.route('**/reset-password/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password updated successfully'
          })
        });
      });

      // Step 7: Submit reset password form
      const resetButton = page.locator('button[type="submit"]');
      await resetButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);

      // Step 8: Login with new password
      await fillLoginForm(page, testUsers.validUser.email, newPassword);
      
      // Mock successful login with new password
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

      const loginButton = page.locator('button[type="submit"]');
      await loginButton.click();

      // Should redirect to home page
      await expect(page).toHaveURL(/.*home/);
    });

    test('should handle invalid reset token', async ({ page }) => {
      // Navigate to reset password page with invalid token
      await page.goto('/reset-password/invalid/token');
      await waitForPageLoad(page);

      // Fill reset password form
      await page.fill('input[id="password"]', 'NewPassword123!');
      await page.fill('input[id="confirmPassword"]', 'NewPassword123!');
      
      // Mock invalid token response
      await page.route('**/reset-password/**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid or expired reset token'
          })
        });
      });

      // Submit reset password form
      const resetButton = page.locator('button[type="submit"]');
      await resetButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/invalid or expired reset token/i);
    });
  });

  test.describe('Admin Authentication Flow', () => {
    test('should complete admin login flow', async ({ page }) => {
      // Navigate to login page
      await page.goto(testUrls.login);
      await waitForPageLoad(page);

      // Activate admin mode
      await page.keyboard.press('Control+Shift+KeyQ');
      await page.waitForTimeout(500);

      // Fill admin login form
      await page.fill('input[id="accessName"]', testUsers.adminUser.accessName);
      await page.fill('input[id="adminPassword"]', testUsers.adminUser.password);
      await page.fill('input[id="adminKey"]', testUsers.adminUser.adminKey);
      
      // Mock successful admin login
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

      // Submit admin login form
      const adminLoginButton = page.locator('button[type="submit"]');
      await adminLoginButton.click();

      // Should redirect to admin home page
      await expect(page).toHaveURL(/.*admin-home/);
    });

    test('should handle admin login failure', async ({ page }) => {
      // Navigate to login page
      await page.goto(testUrls.login);
      await waitForPageLoad(page);

      // Activate admin mode
      await page.keyboard.press('Control+Shift+KeyQ');
      await page.waitForTimeout(500);

      // Fill admin login form with invalid credentials
      await page.fill('input[id="accessName"]', 'wrongadmin');
      await page.fill('input[id="adminPassword"]', 'wrongpass');
      await page.fill('input[id="adminKey"]', 'wrongkey');
      
      // Mock failed admin login
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

      // Submit admin login form
      const adminLoginButton = page.locator('button[type="submit"]');
      await adminLoginButton.click();

      // Should show error message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/invalid admin credentials/i);
    });
  });

  test.describe('Cross-Browser Authentication Flow', () => {
    test('should work consistently across different browsers', async ({ page }) => {
      // Test registration flow
      await page.goto(testUrls.registration);
      await waitForPageLoad(page);

      // Fill and submit registration form
      await fillRegistrationForm(page, testUsers.validUser);
      
      await page.route('**/userRegister', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration successful'
          })
        });
      });

      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*login/);

      // Test login flow
      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
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

      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*home/);
    });
  });

  test.describe('Mobile Authentication Flow', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test registration flow
      await page.goto(testUrls.registration);
      await waitForPageLoad(page);

      // Fill registration form
      await fillRegistrationForm(page, testUsers.validUser);
      
      await page.route('**/userRegister', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration successful'
          })
        });
      });

      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*login/);

      // Test login flow
      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
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

      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*home/);
    });
  });

  test.describe('Error Recovery Flow', () => {
    test('should handle network errors and allow retry', async ({ page }) => {
      // Navigate to login page
      await page.goto(testUrls.login);
      await waitForPageLoad(page);

      // Fill login form
      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
      // Mock network error
      await page.route('**/login', route => route.abort());

      // Submit login form
      await page.locator('button[type="submit"]').click();

      // Should show error message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/login failed/i);

      // Fix network issue and retry
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

      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*home/);
    });

    test('should handle session timeout and redirect to login', async ({ page }) => {
      // Navigate to a protected page (assuming user is logged in)
      await page.goto(testUrls.home);
      await waitForPageLoad(page);

      // Mock session timeout
      await page.route('**/home', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Session expired'
          })
        });
      });

      // Reload page to trigger session check
      await page.reload();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle rapid form submissions', async ({ page }) => {
      await page.goto(testUrls.login);
      await waitForPageLoad(page);

      // Fill login form
      await fillLoginForm(page, testUsers.validUser.email, testUsers.validUser.password);
      
      // Mock successful login
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

      // Rapidly click submit button multiple times
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await submitButton.click();
      await submitButton.click();

      // Should still redirect to home page
      await expect(page).toHaveURL(/.*home/);
    });
  });
});
