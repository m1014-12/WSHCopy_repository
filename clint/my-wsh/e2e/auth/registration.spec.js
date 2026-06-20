const { test, expect } = require('@playwright/test');
const { testUsers, testUrls } = require('../utils/test-data');
const { 
  fillRegistrationForm, 
  getAlertMessage, 
  waitForPageLoad,
  checkPasswordRequirements,
  takeTimestampedScreenshot
} = require('../utils/helpers');

test.describe('Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrls.registration);
    await waitForPageLoad(page);
  });

  test.describe('Form Rendering', () => {
    test('should render registration form correctly', async ({ page }) => {
      // Check page title and main elements
      await expect(page.locator('h1')).toContainText(/registration/i);
      
      // Check all form fields
      await expect(page.locator('input[id="username"]')).toBeVisible();
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="phoneNumber"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check password requirements list
      await expect(page.locator('.password-requirements')).toBeVisible();
      await expect(page.locator('li:has-text("At least 8 characters")')).toBeVisible();
      await expect(page.locator('li:has-text("Not more than 20 characters")')).toBeVisible();
      await expect(page.locator('li:has-text("Uppercase letter")')).toBeVisible();
      await expect(page.locator('li:has-text("Lowercase letter")')).toBeVisible();
      await expect(page.locator('li:has-text("Number")')).toBeVisible();
      await expect(page.locator('li:has-text("Special character")')).toBeVisible();
    });

    test('should display navigation links', async ({ page }) => {
      await expect(page.locator('a[href="/login"]')).toBeVisible();
      await expect(page.locator('text=Already have an account')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate username length', async ({ page }) => {
      const usernameInput = page.locator('input[id="username"]');
      
      // Test username too long
      await usernameInput.fill('thisisareallylongusernamethatexceedsthelimit');
      
      // Should show validation error
      await expect(page.locator('.error-text')).toContainText(/username maximum/i);
    });

    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      
      // Test invalid email
      await emailInput.fill('invalid-email');
      
      // Should show validation error
      await expect(page.locator('.error-text')).toContainText(/email valid/i);
    });

    test('should validate phone number format', async ({ page }) => {
      const phoneInput = page.locator('input[id="phoneNumber"]');
      
      // Test invalid phone number
      await phoneInput.fill('123456');
      await expect(page.locator('.phone-feedback')).toContainText(/invalid phone/i);
      
      // Test valid phone number
      await phoneInput.fill('97123456');
      await expect(page.locator('.phone-feedback')).toContainText(/valid phone/i);
    });

    test('should validate password requirements in real-time', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      
      // Test weak password
      await passwordInput.fill('weak');
      await expect(page.locator('li:has-text("At least 8 characters")')).toHaveClass(/invalid/);
      
      // Test password with uppercase
      await passwordInput.fill('Password123!');
      await expect(page.locator('li:has-text("Uppercase letter")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Lowercase letter")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Number")')).toHaveClass(/valid/);
      await expect(page.locator('li:has-text("Special character")')).toHaveClass(/valid/);
    });

    test('should validate password confirmation', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const confirmPasswordInput = page.locator('input[id="confirmPassword"]');
      
      await passwordInput.fill('Password123!');
      await confirmPasswordInput.fill('DifferentPassword123!');
      
      // Should show validation error
      await expect(page.locator('.error-text')).toContainText(/passwords no match/i);
    });

    test('should prevent submission with empty fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/fill all/i);
    });
  });

  test.describe('Successful Registration', () => {
    test('should handle successful registration', async ({ page }) => {
      // Mock successful registration response
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

      await fillRegistrationForm(page, testUsers.validUser);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show success message and redirect
      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/registration done/i);
      
      await expect(page).toHaveURL(/.*login/);
    });

    test('should handle registration with existing email', async ({ page }) => {
      // Mock failed registration response
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

      await fillRegistrationForm(page, {
        ...testUsers.validUser,
        email: 'existing@example.com'
      });
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/email already exists/i);
    });

    test('should handle network error during registration', async ({ page }) => {
      // Mock network error
      await page.route('**/userRegister', route => route.abort());

      await fillRegistrationForm(page, testUsers.validUser);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/registration failed/i);
    });
  });

  test.describe('Form Interactions', () => {
    test('should clear validation errors when fixing input', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      
      // Enter invalid email
      await emailInput.fill('invalid-email');
      await expect(page.locator('.error-text')).toContainText(/email valid/i);
      
      // Fix the email
      await emailInput.fill('valid@example.com');
      await expect(page.locator('.error-text')).not.toContainText(/email valid/i);
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

    test('should handle form submission with Enter key', async ({ page }) => {
      // Mock successful registration response
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

      await fillRegistrationForm(page, testUsers.validUser);
      
      // Submit form with Enter key
      await page.keyboard.press('Enter');

      const alertMessage = await getAlertMessage(page);
      expect(alertMessage).toContain(/registration done/i);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that all form elements are visible and accessible
      await expect(page.locator('input[id="username"]')).toBeVisible();
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="phoneNumber"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that all form elements are visible and accessible
      await expect(page.locator('input[id="username"]')).toBeVisible();
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="phoneNumber"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and IDs', async ({ page }) => {
      const inputs = [
        'input[id="username"]',
        'input[id="email"]',
        'input[id="phoneNumber"]',
        'input[id="password"]',
        'input[id="confirmPassword"]'
      ];

      for (const inputSelector of inputs) {
        const input = page.locator(inputSelector);
        await expect(input).toBeVisible();
        
        const id = await input.getAttribute('id');
        await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="username"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="phoneNumber"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[id="confirmPassword"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      // Check for required attributes
      await expect(page.locator('input[id="username"]')).toHaveAttribute('required');
      await expect(page.locator('input[id="email"]')).toHaveAttribute('required');
      await expect(page.locator('input[id="phoneNumber"]')).toHaveAttribute('required');
      await expect(page.locator('input[id="password"]')).toHaveAttribute('required');
      await expect(page.locator('input[id="confirmPassword"]')).toHaveAttribute('required');
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page }) => {
      // Test basic form functionality
      await fillRegistrationForm(page, testUsers.validUser);
      
      // Check that all fields are filled correctly
      await expect(page.locator('input[id="username"]')).toHaveValue(testUsers.validUser.username);
      await expect(page.locator('input[id="email"]')).toHaveValue(testUsers.validUser.email);
      await expect(page.locator('input[id="phoneNumber"]')).toHaveValue(testUsers.validUser.phoneNumber);
      await expect(page.locator('input[id="password"]')).toHaveValue(testUsers.validUser.password);
      await expect(page.locator('input[id="confirmPassword"]')).toHaveValue(testUsers.validUser.password);
    });
  });
});
