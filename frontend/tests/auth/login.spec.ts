import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Fill login form with valid credentials
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'AdminPass123!');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard or admin dashboard
    await expect(page).toHaveURL(/\/(dashboard|admin\/dashboard)/);
    
    // Should show success toast
    await expect(page.locator('text=Login successful!')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('[data-testid="email"]', 'wrong@test.com');
    await page.fill('[data-testid="password"]', 'wrongpass');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Should show error toast
    await expect(page.locator('text=Login failed. Please try again.')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/auth/login');
  });

  test('should validate empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="login-button"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill invalid email format
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.fill('[data-testid="password"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Should show email validation error
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    // Fill password field
    await page.fill('[data-testid="password"]', 'testpassword');
    
    // Password should be hidden by default
    await expect(page.locator('[data-testid="password"]')).toHaveAttribute('type', 'password');
    
    // Click eye icon to show password
    await page.click('button:has(svg)');
    
    // Password should now be visible
    await expect(page.locator('[data-testid="password"]')).toHaveAttribute('type', 'text');
    
    // Click again to hide password
    await page.click('button:has(svg)');
    
    // Password should be hidden again
    await expect(page.locator('[data-testid="password"]')).toHaveAttribute('type', 'password');
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill valid credentials
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'AdminPass123!');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Should show loading text briefly
    await expect(page.locator('text=Logging in...')).toBeVisible();
    
    // Button should be disabled during loading
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
  });

  test('should have forgot password link', async ({ page }) => {
    // Should have forgot password link
    await expect(page.locator('text=Forgot password?')).toBeVisible();
    
    // Link should navigate to forgot password page
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL('/auth/forgot-password');
  });

  test('should have register link', async ({ page }) => {
    // Should have sign up link
    await expect(page.locator('text=Sign up')).toBeVisible();
    
    // Link should navigate to register page
    await page.click('text=Sign up');
    await expect(page).toHaveURL('/auth/register');
  });

  test('should store JWT token after successful login', async ({ page }) => {
    // Fill valid credentials
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'AdminPass123!');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect
    await expect(page).toHaveURL(/\/(dashboard|admin\/dashboard)/);
    
    // Check if token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('should redirect admin to admin dashboard', async ({ page }) => {
    // Fill admin credentials
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'AdminPass123!');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should redirect recruiter to regular dashboard', async ({ page }) => {
    // Fill recruiter credentials
    await page.fill('[data-testid="email"]', 'recruiter@test.com');
    await page.fill('[data-testid="password"]', 'RecruiterPass123!');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to regular dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});