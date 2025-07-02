import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should complete full signup flow', async ({ page }) => {
      // Navigate to signup page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('/signup');

      // Fill out signup form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'testuser@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePass123!');

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard or show success message
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.click('text=Sign Up');
      
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'SecurePass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.click('text=Sign Up');
      
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'weak');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.click('text=Sign Up');
      
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should handle existing email registration', async ({ page }) => {
      await page.click('text=Sign Up');
      
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=User with this email already exists')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.click('text=Login');
      await expect(page).toHaveURL('/login');

      await page.fill('input[name="email"]', 'valid@example.com');
      await page.fill('input[name="password"]', 'ValidPass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.click('text=Login');
      
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('text=Login');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should show loading state during authentication', async ({ page }) => {
      await page.click('text=Login');
      
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.fill('input[name="password"]', 'ValidPass123!');
      
      // Start login and immediately check for loading state
      await page.click('button[type="submit"]');
      await expect(page.locator('button:disabled')).toBeVisible();
      await expect(page.locator('text=Signing in...')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset flow', async ({ page }) => {
      await page.click('text=Login');
      await page.click('text=Forgot your password?');
      
      await expect(page).toHaveURL('/reset-password');
      
      await page.fill('input[name="email"]', 'user@example.com');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Password reset email sent')).toBeVisible();
      await expect(page.locator('text=Check your email for reset instructions')).toBeVisible();
    });

    test('should validate email in password reset', async ({ page }) => {
      await page.goto('/reset-password');
      
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    });

    test('should handle non-existent email in reset', async ({ page }) => {
      await page.goto('/reset-password');
      
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');
      
      // Should still show success message for security reasons
      await expect(page.locator('text=Password reset email sent')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.fill('input[name="password"]', 'ValidPass123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // Reload page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL('/login');
      await expect(page.locator('text=Please sign in to continue')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.fill('input[name="password"]', 'ValidPass123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sign Out');
      
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=Login')).toBeVisible();
    });

    test('should handle expired sessions', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.fill('input[name="password"]', 'ValidPass123!');
      await page.click('button[type="submit"]');
      
      // Clear cookies to simulate expired session
      await context.clearCookies();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL('/login');
      await expect(page.locator('text=Your session has expired')).toBeVisible();
    });
  });

  test.describe('Navigation Protection', () => {
    test('should prevent access to dashboard without authentication', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL('/login');
    });

    test('should prevent access to conversations without authentication', async ({ page }) => {
      await page.goto('/dashboard/conversations');
      
      await expect(page).toHaveURL('/login');
    });

    test('should prevent access to settings without authentication', async ({ page }) => {
      await page.goto('/dashboard/settings');
      
      await expect(page).toHaveURL('/login');
    });

    test('should redirect authenticated users from auth pages', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.fill('input[name="password"]', 'ValidPass123!');
      await page.click('button[type="submit"]');
      
      // Try to access login page while authenticated
      await page.goto('/login');
      await expect(page).toHaveURL('/dashboard');
      
      // Try to access signup page while authenticated
      await page.goto('/signup');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/auth/**', route => {
        route.abort();
      });
      
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Network error. Please try again.')).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Something went wrong. Please try again later.')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
      await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
    });

    test('should announce form errors to screen readers', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('[role="alert"]')).toBeVisible();
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });
  });
});