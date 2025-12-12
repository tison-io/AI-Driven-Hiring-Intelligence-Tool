import { test, expect } from '@playwright/test';
import { Golos_Text } from 'next/font/google';

test('should redirect unauthenticated user to login', async ({page}) => {
    // Try to access protected route without login
    await page.goto("/dashboard");
    // Should redirect to Login page
    await expect(page).toHaveURL("/auth/login");
});

test('should allow authenticated user access to protected pages', async ({page}) => {
    // Login first 
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'admin2@test.com');
    await page.fill('[data-testid="password"]', 'AdminPass123!');
    await page.click('[data-testid="login-button"]');
    // Wait for login to complete
    await expect(page).toHaveURL('/admin/dashboard');
    // should access protected route
    await page.goto("/error-logs");
    await expect(page).toHaveURL('/error-logs');
});


test('should redirect admin to admin dashboard', async ({ page }) => {
  // Login as admin
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'admin2@test.com');
  await page.fill('[data-testid="password"]', 'AdminPass123!');
  await page.click('[data-testid="login-button"]');
  
  // Should redirect to admin dashboard
  await expect(page).toHaveURL('/admin/dashboard');
});

test('should redirect recruiter to regular dashboard', async ({ page }) => {
  // Login as recruiter
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'recruiter@test.com');
  await page.fill('[data-testid="password"]', 'RecruiterPass123!');
  await page.click('[data-testid="login-button"]');
  
  // Should redirect to regular dashboard
  await expect(page).toHaveURL('/dashboard');
});

test('should maintain login state across browser refresh', async ({ page }) => {
  // Login first
  // Login first
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'admin2@test.com');
  await page.fill('[data-testid="password"]', 'AdminPass123!');
  await page.click('[data-testid="login-button"]');
  // Wait for login to complete
  await expect(page).toHaveURL('/admin/dashboard');
  // Refresh the page
  await page.reload();
  // Wait for auth context to initialize and should still be on dashboard
  await page.waitForTimeout(1000); 
  // Should still be logged in and on dashboard
  await expect(page).toHaveURL('/admin/dashboard');
});