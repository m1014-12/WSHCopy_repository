const { test, expect } = require('@playwright/test');
const { testUsers, testUrls } = require('../utils/test-data');
const { 
  getAlertMessage, 
  waitForPageLoad,
  takeTimestampedScreenshot
} = require('../utils/helpers');

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrls.forgotPassword);
    await waitForPageLoad(page);
  });

  test.describe('Form Rendering', () => {
    test('should render forgot password form correctly', async ({ page }) => {
      // Check page title and main elements
      await expect(page.locator('h1')).toContainText(/forgot password/i);
      
      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('button')).toContainText(/send reset link/i);
      
      // Check navigation links
      await expect(page.locator('a[href="/login"]')).toBeVisible();
      await expect(page.locator('text=Know your password')).toBeVisible();
    });

    test('should display theme and language toggles', async ({ page }) => {
      await expect(page.locator('[data-testid="theme-language-toggles"]')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should display validation error for empty email', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation error
      await expect(page.locator('.message')).toContainText(/fill email/i);
    });

    test('should accept valid email format', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('valid@example.com');
      
      // Email input should accept the value
      await expect(emailInput).toHaveValue('valid@example.com');
    });

    test('should handle invalid email format gracefully', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('invalid-email');
      
      // Form should still accept the input (validation happens on server)
      await expect(emailInput).toHaveValue('invalid-email');
    });
  });

  test.describe('Password Reset Request', () => {
    test('should handle successful password reset request', async ({ page }) => {
      // Mock successful password reset response
      await page.route('**/forgot-password', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset link sent to your email'
          })
        });
      });

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUsers.validUser.email);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show success message
      await expect(page.locator('.message')).toContainText(/password reset link sent/i);
      await expect(page.locator('.message')).toHaveClass(/success/);
    });

    test('should handle email not found error', async ({ page }) => {
      // Mock email not found response
      await page.route('**/forgot-password', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Email not found'
          })
        });
      });

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('nonexistent@example.com');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/email not found/i);
      await expect(page.locator('.message')).toHaveClass(/error/);
    });

    test('should handle server error', async ({ page }) => {
      // Mock server error response
      await page.route('**/forgot-password', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Server error occurred'
          })
        });
      });

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUsers.validUser.email);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/server error occurred/i);
      await expect(page.locator('.message')).toHaveClass(/error/);
    });

    test('should handle network error', async ({ page }) => {
      // Mock network error
      await page.route('**/forgot-password', route => route.abort());

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUsers.validUser.email);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.message')).toContainText(/error message/i);
      await expect(page.locator('.message')).toHaveClass(/error/);
    });
  });

  test.describe('Form Interactions', () => {
    test('should clear validation errors when fixing input', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      
      // Submit empty form to trigger validation error
      await submitButton.click();
      await expect(page.locator('.message')).toContainText(/fill email/i);
      
      // Fill email to clear validation error
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('test@example.com');
      
      // Submit again
      await submitButton.click();
      
      // Should not show the fill email error anymore
      await expect(page.locator('.message')).not.toContainText(/fill email/i);
    });

    test('should handle form submission with Enter key', async ({ page }) => {
      // Mock successful response
      await page.route('**/forgot-password', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset link sent to your email'
          })
        });
      });

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUsers.validUser.email);
      
      // Submit form with Enter key
      await emailInput.press('Enter');

      // Should show success message
      await expect(page.locator('.message')).toContainText(/password reset link sent/i);
    });

    test('should maintain email value after submission', async ({ page }) => {
      // Mock successful response
      await page.route('**/forgot-password', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset link sent to your email'
          })
        });
      });

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUsers.validUser.email);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Email field should still contain the value
      await expect(emailInput).toHaveValue(testUsers.validUser.email);
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
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('a[href="/login"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that form is still accessible
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('a[href="/login"]')).toBeVisible();
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
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and IDs', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      const id = await emailInput.getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to email input
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('required');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should provide clear error messages', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Error message should be clear and helpful
      const errorMessage = page.locator('.message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/fill email/i);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page }) => {
      // Test basic form functionality
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('test@example.com');
      
      // Check that email is filled correctly
      await expect(emailInput).toHaveValue('test@example.com');
      
      // Test button click
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('should handle email validation consistently', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      
      // Test valid email
      await emailInput.fill('valid@example.com');
      await expect(emailInput).toHaveValue('valid@example.com');
      
      // Test invalid email (browser validation)
      await emailInput.fill('invalid-email');
      await expect(emailInput).toHaveValue('invalid-email');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle multiple error scenarios', async ({ page }) => {
      const errorScenarios = [
        { status: 400, message: 'Invalid email format' },
        { status: 404, message: 'User not found' },
        { status: 429, message: 'Too many requests' },
        { status: 500, message: 'Internal server error' }
      ];

      for (const scenario of errorScenarios) {
        // Mock error response
        await page.route('**/forgot-password', route => {
          route.fulfill({
            status: scenario.status,
            contentType: 'application/json',
            body: JSON.stringify({
              message: scenario.message
            })
          });
        });

        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill('test@example.com');
        
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Should show appropriate error message
        await expect(page.locator('.message')).toContainText(scenario.message);
        await expect(page.locator('.message')).toHaveClass(/error/);
        
        // Clear the route for next iteration
        await page.unroute('**/forgot-password');
      }
    });
  });
});
