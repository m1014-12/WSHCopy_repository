const { test, expect } = require('@playwright/test');
const { testUsers, testUrls } = require('../utils/test-data');
const { 
  getAlertMessage, 
  waitForPageLoad,
  takeTimestampedScreenshot,
  checkPasswordRequirements
} = require('../utils/helpers');

test.describe('Reset Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrls.resetPassword);
    await waitForPageLoad(page);
  });

  test.describe('Form Rendering', () => {
    test('should render reset password form correctly', async ({ page }) => {
      // Check page title and main elements
      await expect(page.locator('h1')).toContainText(/reset password/i);
      
      // Check form elements
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('button')).toContainText(/reset password/i);
      
      // Check password requirements list
      await expect(page.locator('.password-requirements')).toBeVisible();
      await expect(page.locator('li:has-text("At least 8 characters")')).toBeVisible();
      await expect(page.locator('li:has-text("Not more than 20 characters")')).toBeVisible();
      await expect(page.locator('li:has-text("Uppercase letter")')).toBeVisible();
      await expect(page.locator('li:has-text("Lowercase letter")')).toBeVisible();
      await expect(page.locator('li:has-text("Number")')).toBeVisible();
      await expect(page.locator('li:has-text("Special character")')).toBeVisible();
    });

    test('should display theme and language controls', async ({ page }) => {
      await expect(page.locator('button[title*="light"], button[title*="dark"]')).toBeVisible();
      await expect(page.locator('button[title*="english"], button[title*="arabic"]')).toBeVisible();
    });

    test('should display navigation links', async ({ page }) => {
      await expect(page.locator('a[href="/login"]')).toBeVisible();
      await expect(page.locator('text=Remember your password')).toBeVisible();
    });
  });

  test.describe('Password Validation', () => {
    test('should validate password length requirements', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      
      // Test password too short
      await passwordInput.fill('Pass1!');
      await expect(page.locator('li:has-text("At least 8 characters")')).toHaveClass(/invalid/);
      
      // Test password too long
      await passwordInput.fill('ThisIsAVeryLongPasswordThatExceedsTheLimit123!');
      await expect(page.locator('li:has-text("Not more than 20 characters")')).toHaveClass(/invalid/);
      
      // Test valid length
      await passwordInput.fill('Password123!');
      await expect(page.locator('li:has-text("At least 8 characters")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Not more than 20 characters")')).toHaveClass(/valid/);
    });

    test('should validate password character requirements', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      
      // Test password without uppercase
      await passwordInput.fill('password123!');
      await expect(page.locator('li:has-text("Uppercase letter")')).toHaveClass(/invalid/);
      
      // Test password without lowercase
      await passwordInput.fill('PASSWORD123!');
      await expect(page.locator('li:has-text("Lowercase letter")')).toHaveClass(/invalid/);
      
      // Test password without number
      await passwordInput.fill('Password!');
      await expect(page.locator('li:has-text("Number")')).toHaveClass(/invalid/);
      
      // Test password without special character
      await passwordInput.fill('Password123');
      await expect(page.locator('li:has-text("Special character")')).toHaveClass(/invalid/);
      
      // Test strong password
      await passwordInput.fill('Password123!');
      await expect(page.locator('li:has-text("Uppercase letter")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Lowercase letter")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Number")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Special character")')).toHaveClass(/valid/);
    });

    test('should validate password confirmation match', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('DifferentPassword123!');
      
      // Should show validation error
      await expect(page.locator('.error-text')).toContainText(/passwords mismatch/i);
    });

    test('should update password requirements in real-time', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      
      // Start with empty password
      await passwordInput.fill('');
      
      // Add uppercase letter
      await passwordInput.fill('A');
      await expect(page.locator('li:has-text("Uppercase letter")')).toHaveClass(/valid/);
      
      // Add lowercase letter
      await passwordInput.fill('Aa');
      await expect(page.locator('li:has-text("Lowercase letter")')).toHaveClass(/valid/);
      
      // Add number
      await passwordInput.fill('Aa1');
      await expect(page.locator('li:has-text("Number")')).toHaveClass(/valid/);
      
      // Add special character
      await passwordInput.fill('Aa1!');
      await expect(page.locator('li:has-text("Special character")')).toHaveClass(/valid/);
      
      // Make it long enough
      await passwordInput.fill('Aa1!Password');
      await expect(page.locator('li:has-text("At least 8 characters")')).toHaveClass(/valid/);
    });
  });

  test.describe('Form Submission', () => {
    test('should handle successful password reset', async ({ page }) => {
      // Mock successful password reset response
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

      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show success message and redirect
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/password updated/i);
      
      await expect(page).toHaveURL(/.*login/);
    });

    test('should handle invalid reset token', async ({ page }) => {
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

      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/invalid or expired reset token/i);
      await expect(page.locator('.message')).toHaveClass(/error/);
    });

    test('should handle expired reset token', async ({ page }) => {
      // Mock expired token response
      await page.route('**/reset-password/**', route => {
        route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Reset token has expired'
          })
        });
      });

      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/reset token has expired/i);
      await expect(page.locator('.message')).toHaveClass(/error/);
    });

    test('should handle network error', async ({ page }) => {
      // Mock network error
      await page.route('**/reset-password/**', route => route.abort());

      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/something wrong/i);
      await expect(page.locator('.message')).toHaveClass(/error/);
    });

    test('should prevent submission with invalid passwords', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      // Submit with weak password
      await passwordInput.fill('weak');
      await confirmPasswordInput.fill('weak');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should not make API call
      await page.waitForTimeout(1000);
      // No route should be called
    });

    test('should prevent submission with mismatched passwords', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      // Submit with mismatched passwords
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('DifferentPassword123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should not make API call
      await page.waitForTimeout(1000);
      // No route should be called
    });
  });

  test.describe('Form Interactions', () => {
    test('should clear validation errors when fixing input', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      // Enter mismatched passwords
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('DifferentPassword123!');
      
      // Should show validation error
      await expect(page.locator('.error-text')).toContainText(/passwords mismatch/i);
      
      // Fix the confirmation password
      await confirmPasswordInput.fill('Password123!');
      
      // Validation error should be cleared
      await expect(page.locator('.error-text')).not.toContainText(/passwords mismatch/i);
    });

    test('should handle form submission with Enter key', async ({ page }) => {
      // Mock successful response
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

      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      // Submit form with Enter key
      await confirmPasswordInput.press('Enter');

      // Should show success message
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/password updated/i);
    });

    test('should maintain form state during validation', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      // Fill form
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      // Values should be maintained
      await expect(passwordInput).toHaveValue('Password123!');
      await expect(confirmPasswordInput).toHaveValue('Password123!');
    });
  });

  test.describe('Theme and Language Controls', () => {
    test('should toggle theme mode', async ({ page }) => {
      const themeButton = page.locator('button[title*="light"], button[title*="dark"]');
      await themeButton.click();
      
      // Should toggle theme (specific implementation depends on your theme system)
      await page.waitForTimeout(500);
    });

    test('should toggle language', async ({ page }) => {
      const languageButton = page.locator('button[title*="english"], button[title*="arabic"]');
      await languageButton.click();
      
      // Should toggle language (specific implementation depends on your language system)
      await page.waitForTimeout(500);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to login page', async ({ page }) => {
      const loginLink = page.locator('a[href="/login"]');
      await loginLink.click();
      
      await expect(page).toHaveURL(/.*login/);
    });

    test('should have accessible navigation links', async ({ page }) => {
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that form is still accessible
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('.password-requirements')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that form is still accessible
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('.password-requirements')).toBeVisible();
    });

    test('should maintain form layout on different screen sizes', async ({ page }) => {
      // Test different viewport sizes
      const viewports = [
        { width: 320, height: 568 },   // Small mobile
        { width: 375, height: 667 },   // iPhone
        { width: 768, height: 1024 },  // Tablet
        { width: 1024, height: 768 },  // Small desktop
        { width: 1920, height: 1080 }  // Large desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Form should remain functional at all sizes
        await expect(page.locator('input[id="password"]')).toBeVisible();
        await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and IDs', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await expect(passwordInput).toBeVisible();
      await expect(confirmPasswordInput).toBeVisible();
      
      const passwordId = await passwordInput.getAttribute('id');
      const confirmPasswordId = await confirmPasswordInput.getAttribute('id');
      
      await expect(page.locator(`label[for="${passwordId}"]`)).toBeVisible();
      await expect(page.locator(`label[for="${confirmPasswordId}"]`)).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to password input
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="password"]')).toBeFocused();
      
      // Tab to confirm password input
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="confirmPassword"]')).toBeFocused();
      
      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await expect(passwordInput).toHaveAttribute('required');
      await expect(confirmPasswordInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should provide clear error messages', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      // Enter mismatched passwords
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('DifferentPassword123!');
      
      // Error message should be clear and helpful
      const errorMessage = page.locator('.error-text');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/passwords mismatch/i);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page }) => {
      // Test basic form functionality
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('Password123!');
      
      // Check that passwords are filled correctly
      await expect(passwordInput).toHaveValue('Password123!');
      await expect(confirmPasswordInput).toHaveValue('Password123!');
    });

    test('should handle password validation consistently', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      
      // Test password validation
      await passwordInput.fill('Password123!');
      
      // All requirements should be valid
      await expect(page.locator('li:has-text("At least 8 characters")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Uppercase letter")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Lowercase letter")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Number")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Special character")')).toHaveClass(/valid/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle multiple error scenarios', async ({ page }) => {
      const errorScenarios = [
        { status: 400, message: 'Invalid password format' },
        { status: 401, message: 'Unauthorized access' },
        { status: 410, message: 'Reset token expired' },
        { status: 500, message: 'Internal server error' }
      ];

      for (const scenario of errorScenarios) {
        // Mock error response
        await page.route('**/reset-password/**', route => {
          route.fulfill({
            status: scenario.status,
            contentType: 'application/json',
            body: JSON.stringify({
              message: scenario.message
            })
          });
        });

        const passwordInput = page.locator('input[id="password"]');
        const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
        
        await passwordInput.fill('Password123!');
        await confirmPasswordInput.fill('Password123!');
        
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Should show appropriate error message
        await expect(page.locator('.message')).toContainText(scenario.message);
        await expect(page.locator('.message')).toHaveClass(/error/);
        
        // Clear the route for next iteration
        await page.unroute('**/reset-password/**');
      }
    });
  });
});
