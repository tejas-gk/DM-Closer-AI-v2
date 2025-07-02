import { test, expect } from '@playwright/test';

test.describe('Conversation Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - assuming user is logged in
    await page.goto('/dashboard');
  });

  test('should display conversation list', async ({ page }) => {
    await page.click('text=Conversations');
    await expect(page).toHaveURL('/dashboard/conversations');

    // Should show conversation items
    await expect(page.locator('[data-testid="conversation-item"]')).toHaveCount.greaterThan(0);
    
    // Should show participant names
    await expect(page.locator('text=Sarah Martinez')).toBeVisible();
    await expect(page.locator('text=Mike Johnson')).toBeVisible();
  });

  test('should open conversation thread', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    
    // Click on first conversation
    await page.click('[data-testid="conversation-item"]:first-child');
    
    // Should show message thread
    await expect(page.locator('[data-testid="message-thread"]')).toBeVisible();
    await expect(page.locator('[data-testid="message"]')).toHaveCount.greaterThan(0);
  });

  test('should generate AI response', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.click('[data-testid="conversation-item"]:first-child');
    
    // Click AI generate button
    await page.click('[data-testid="generate-ai-response"]');
    
    // Should show AI response preview
    await expect(page.locator('[data-testid="ai-response-preview"]')).toBeVisible();
    
    // Should have send and edit options
    await expect(page.locator('text=Send Response')).toBeVisible();
    await expect(page.locator('text=Edit Response')).toBeVisible();
  });

  test('should send manual reply', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.click('[data-testid="conversation-item"]:first-child');
    
    // Type manual message
    await page.fill('[data-testid="message-input"]', 'Thank you for your interest in our services!');
    await page.click('[data-testid="send-message"]');
    
    // Should add message to thread
    await expect(page.locator('text=Thank you for your interest in our services!')).toBeVisible();
  });

  test('should filter conversations by search', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    
    // Search for specific participant
    await page.fill('[data-testid="search-conversations"]', 'Sarah');
    
    // Should filter results
    await expect(page.locator('text=Sarah Martinez')).toBeVisible();
    await expect(page.locator('text=Mike Johnson')).not.toBeVisible();
  });

  test('should handle mobile responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/conversations');
    
    // Should show mobile layout
    await expect(page.locator('[data-testid="mobile-conversation-list"]')).toBeVisible();
    
    // Click conversation should open in full screen
    await page.click('[data-testid="conversation-item"]:first-child');
    await expect(page.locator('[data-testid="mobile-message-thread"]')).toBeVisible();
  });
});