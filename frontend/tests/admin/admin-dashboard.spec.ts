import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', 'Admin123@');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should restrict access to admin role only', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Monitor system performance')).toBeVisible();
  });

  test('should display system-wide statistics', async ({ page }) => {
    await page.route('**/api/dashboard/admin*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidatesProcessed: { current: 150, percentageChange: 12.5, trend: 'up' },
          averageRoleFitScore: { current: 76, percentageChange: 3.2, trend: 'up' },
          totalShortlisted: { current: 45, percentageChange: -2.1, trend: 'down' },
          systemHealth: { averageProcessingTime: 8500, failedProcessingCount: 3 }
        })
      });
    });

    await page.goto('/admin/dashboard');
    
    await expect(page.locator('text=Total Candidates Processed')).toBeVisible();
    await expect(page.locator('text=150')).toBeVisible();
    await expect(page.locator('text=Average Role-Fit Score')).toBeVisible();
    await expect(page.locator('text=76%')).toBeVisible();
    await expect(page.locator('text=Total Shortlisted')).toBeVisible();
    await expect(page.locator('text=45')).toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    await page.route('**/api/dashboard/admin*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidatesProcessed: { current: 150, percentageChange: 12.5, trend: 'up' },
          averageRoleFitScore: { current: 76, percentageChange: 3.2, trend: 'up' },
          totalShortlisted: { current: 45, percentageChange: -2.1, trend: 'down' },
          systemHealth: { averageProcessingTime: 8500, failedProcessingCount: 3 }
        })
      });
    });

    await page.goto('/admin/dashboard');
    
    await expect(page.locator('text=System Health Metrics')).toBeVisible();
    await expect(page.locator('text=Avg. Evaluation Latency')).toBeVisible();
    await expect(page.locator('text=Parser/AI Errors (24h)')).toBeVisible();
  });

  test('should handle loading and error states', async ({ page }) => {
    await page.route('**/api/dashboard/admin*', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) });
    });

    await page.goto('/admin/dashboard');
    await expect(page.locator('text=Error: Server error')).toBeVisible();
  });
});