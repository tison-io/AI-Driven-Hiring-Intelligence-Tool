import { test, expect } from '@playwright/test';

test.describe('Export Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'recruiter1@test.com');
    await page.fill('input[type="password"]', 'NewPassword1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Mock candidates data
    await page.route('**/api/candidates', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            _id: '1',
            name: 'John Doe',
            jobRole: 'Frontend Developer',
            roleFitScore: 85,
            experienceYears: 3,
            skills: ['React', 'JavaScript', 'CSS'],
            status: 'completed',
            confidenceScore: 92
          },
          {
            _id: '2', 
            name: 'Jane Smith',
            jobRole: 'Backend Engineer',
            roleFitScore: 78,
            experienceYears: 5,
            skills: ['Node.js', 'Python', 'MongoDB'],
            status: 'completed',
            confidenceScore: 88
          }
        ])
      });
    });
    
    await page.goto('/candidates');
  });

  test('should display export format selection dropdown', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible();
    await page.click('button:has-text("Export Data")');
    await expect(page.locator('text=Export as CSV')).toBeVisible();
    await expect(page.locator('text=Export as XLSX')).toBeVisible();
  });

  test('should show export progress indicator during CSV export', async ({ page }) => {
    await page.route('**/api/export/candidates*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        body: 'mock,csv,data\nJohn,Doe,85\nJane,Smith,78',
        headers: { 'Content-Type': 'text/csv' }
      });
    });

    await page.click('button:has-text("Export Data")');
    await page.click('text=Export as CSV');
    await expect(page.locator('text=Exporting...')).toBeVisible();
    await expect(page.locator('button:has-text("Exporting...")')).toBeDisabled();
  });

  test('should trigger file download for CSV export', async ({ page }) => {
    await page.route('**/api/export/candidates*', async route => {
      await route.fulfill({
        status: 200,
        body: 'name,role,score\nJohn Doe,Frontend Developer,85\nJane Smith,Backend Engineer,78',
        headers: { 'Content-Type': 'text/csv' }
      });
    });

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Data")');
    await page.click('text=Export as CSV');
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/candidates-\d{4}-\d{2}-\d{2}\.csv/);
  });
});