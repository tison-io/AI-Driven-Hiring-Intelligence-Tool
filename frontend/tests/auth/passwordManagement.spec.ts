import { test, expect } from '@playwright/test';

test('should validate current password is required', async ({ page }) => {
  // Login and navigate to settings
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'recruiter1@test.com');
  await page.fill('[data-testid="password"]', 'NewPassword1234!');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
  
  await page.goto('/settings');
  
  // Open change password modal
  await page.click('[data-testid="change-password-button"]');
  await expect(page.locator('[data-testid="current-password"]')).toBeVisible();
  
  // Try to submit without current password
  await page.fill('[data-testid="new-password"]', 'NewPassword123!');
  await page.fill('[data-testid="confirm-password"]', 'NewPassword123!');
  await page.click('[data-testid="submit-password-change"]');
  
  // Should show validation error (HTML5 required field)
  await expect(page.locator('[data-testid="current-password"]:invalid')).toBeVisible();
});

test('should validate password confirmation match', async ({ page }) => {
  // Login and navigate to settings
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'recruiter1@test.com');
  await page.fill('[data-testid="password"]', 'NewPassword1234!');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
  
  await page.goto('/settings');
  
  // Open change password modal
  await page.click('[data-testid="change-password-button"]');
  await expect(page.locator('[data-testid="current-password"]')).toBeVisible();
  
  // Fill mismatched passwords
  await page.fill('[data-testid="current-password"]', 'NewPassword1234!');
  await page.fill('[data-testid="new-password"]', 'NewPassword123!');
  await page.fill('[data-testid="confirm-password"]', 'DifferentPassword123!');
  await page.click('[data-testid="submit-password-change"]');
  
  // Should show password mismatch error in modal
  await expect(page.locator('p.text-sm.text-red-600:has-text("Passwords do not match")')).toBeVisible();
});

test('should handle wrong current password error', async ({ page }) => {
  // Login and navigate to settings
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'recruiter1@test.com');
  await page.fill('[data-testid="password"]', 'NewPassword1234!');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/settings');
  
  // Open change password modal
  await page.click('[data-testid="change-password-button"]');
  await expect(page.locator('[data-testid="current-password"]')).toBeVisible();
  
  // Fill wrong current password
  await page.fill('[data-testid="current-password"]', 'WrongPassword123!');
  await page.fill('[data-testid="new-password"]', 'NewPassword123!');
  await page.fill('[data-testid="confirm-password"]', 'NewPassword123!');
  await page.click('[data-testid="submit-password-change"]');
  
  // Should show error message on settings page (modal closes, error shows on page)
  await expect(page.locator('span.text-sm.text-red-600')).toBeVisible();
});

test('should show success notification on password change', async ({ page }) => {
  // Login and navigate to settings
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'recruiter1@test.com');
  await page.fill('[data-testid="password"]', 'NewPassword1234!');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');

  await page.goto('/settings');
  
  // Open change password modal
  await page.click('[data-testid="change-password-button"]');
  await expect(page.locator('[data-testid="current-password"]')).toBeVisible();
  
  // Fill valid password change - change back to original password to not affect other tests
  await page.fill('[data-testid="current-password"]', 'NewPassword1234!');
  await page.fill('[data-testid="new-password"]', 'NewPassword1234!');
  await page.fill('[data-testid="confirm-password"]', 'NewPassword1234!');
  await page.click('[data-testid="submit-password-change"]');
  
  // Should show success message on settings page (modal closes after success)
  await expect(page.locator('span.text-sm.text-green-600:has-text("Password changed successfully")')).toBeVisible();
});