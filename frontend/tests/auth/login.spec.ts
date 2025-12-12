import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Fill login form with valid credentials
    await page.fill('[data-testid="email"]', 'admin2@test.com');
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
    await page.fill('[data-testid="email"]', 'notanemail');
    await page.fill('[data-testid="password"]', 'password123');
    
    // Submit form to trigger validation
    await page.click('[data-testid="login-button"]');
    
    // Should stay on login page (form validation prevents submission)
    await expect(page).toHaveURL('/auth/login');
    
    // Should not show success toast
    await expect(page.locator('text=Login successful!')).not.toBeVisible();
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
    // Add slight delay to catch button loading state
    await page.route('**/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      route.continue();
    });
    
    // Fill valid credentials
    await page.fill('[data-testid="email"]', 'admin2@test.com');
    await page.fill('[data-testid="password"]', 'AdminPass123!');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Check button shows loading state
    await expect(page.locator('[data-testid="login-button"]')).toContainText('Logging in...');
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
    
    // Wait for redirect to complete
    await expect(page).toHaveURL(/\/(dashboard|admin\/dashboard)/);
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
    await page.fill('[data-testid="email"]', 'admin2@test.com');
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
    await page.fill('[data-testid="email"]', 'admin2@test.com');
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