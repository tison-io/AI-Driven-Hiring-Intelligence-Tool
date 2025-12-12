import { test, expect } from '@playwright/test';

test.describe('Resume Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'recruiter1@test.com');
    await page.fill('input[type="password"]', 'NewPassword1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/evaluations/new');
  });

  test('should display upload form with job role input', async ({ page }) => {
    await expect(page.locator('input#job-role')).toBeVisible();
    await expect(page.locator('textarea#job-description')).toBeVisible();
    await expect(page.locator('text=Upload Resume')).toBeVisible();
  });

  test('should validate job role is required', async ({ page }) => {
    // The submit button is disabled until required fields are provided
    await expect(page.locator('button:has-text("Run AI Analysis")')).toBeDisabled();
  });

  test('should show upload tab as active by default', async ({ page }) => {
    await expect(page.locator('button:has-text("Upload Resume")').first()).toHaveClass(/bg-gray-100/);
    await expect(page.locator('button:has-text("LinkedIn URL")')).toBeVisible();
  });

  test('should show drag and drop zone', async ({ page }) => {
    const dropZone = page.locator('text=Drag and drop your resume here');
    await expect(dropZone).toBeVisible();
    await expect(page.locator('text=Supported formats: PDF, DOC, DOCX')).toBeVisible();
  });

  test('should show browse button', async ({ page }) => {
    await expect(page.locator('button:has-text("browse")')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeHidden();
  });

  test('should disable submit button when no file selected', async ({ page }) => {
    await page.fill('input#job-role', 'Backend Engineer');
    await expect(page.locator('button:has-text("Run AI Analysis")')).toBeDisabled();
  });









  test('should show bias disclaimer', async ({ page }) => {
    await expect(page.locator('text=Bias & Privacy Disclaimer')).toBeVisible();
    await expect(page.locator('text=Analysis based solely on professional criteria')).toBeVisible();
  });


});