import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/register');
    });

    test('should register with valid data and redirect to complete-profile', async ({ page }) => {
        // Fill valid form data
        await page.fill('[data-testid="email"]', 'newuser@test.com');
        await page.fill('[data-testid="password"]', 'ValidPass123!');
        await page.check('[data-testid="terms-checkbox"]');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should redirect to complete-profile
        await expect(page).toHaveURL('/complete-profile');
    });

    test('should validate email format', async ({ page }) => {
        // Fill invalid email
        await page.fill('[data-testid="email"]', 'invalid-email@asd');
        await page.fill('[data-testid="password"]', 'ValidPass123!');
        await page.check('[data-testid="terms-checkbox"]');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should show email validation error
        await expect(page.locator('text=Invalid email address')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
        // Fill weak password
        await page.fill('[data-testid="email"]', 'test@test.com');
        await page.fill('[data-testid="password"]', 'password');
        await page.check('[data-testid="terms-checkbox"]');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should show password strength error
        await expect(page.locator('text=Password must contain uppercase, lowercase, number and special character')).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
        // Fill form without checking terms
        await page.fill('[data-testid="email"]', 'test@test.com');
        await page.fill('[data-testid="password"]', 'ValidPass123!');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should show terms validation error
        await expect(page.locator('text=You must agree to the terms')).toBeVisible();
    });

    test('should show loading state during registration', async ({ page }) => {
        // Add delay to catch loading state
        await page.route('**/auth/register', async route => {
            await new Promise(resolve => setTimeout(resolve, 500));
            route.continue();
        });

        // Fill valid form
        await page.fill('[data-testid="email"]', 'test@test.com');
        await page.fill('[data-testid="password"]', 'ValidPass123!');
        await page.check('[data-testid="terms-checkbox"]');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should show loading state
        await expect(page.locator('[data-testid="register-button"]')).toContainText('Creating Account...');
        await expect(page.locator('[data-testid="register-button"]')).toBeDisabled();
    });

});