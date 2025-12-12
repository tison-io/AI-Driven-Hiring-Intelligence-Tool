import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'recruiter1@test.com');
    await page.fill('input[type="password"]', 'NewPassword1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard header with user name', async ({ page }) => {
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
    await expect(page.locator('text=Here is your hiring velocity')).toBeVisible();
    await expect(page.locator('text=Track your recruitment performance')).toBeVisible();
  });

  test('should display total candidates count', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 25,
          averageRoleFitScore: 78,
          shortlistCount: 8,
          processingCount: 3,
          recentCandidates: [],
          shortlistedCandidates: []
        })
      });
    });

    await page.reload();
    // Find the stats card by title then check its value
    const totalCard = page.locator('h3:has-text("Total Candidates")').first();
    await expect(totalCard).toBeVisible();
    await expect(totalCard.locator('..').locator('text=25')).toBeVisible();
  });

  test('should display average score calculation', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 25,
          averageRoleFitScore: 78,
          shortlistCount: 8,
          processingCount: 3,
          recentCandidates: [],
          shortlistedCandidates: []
        })
      });
    });

    await page.reload();
    const avgCard = page.locator('h3:has-text("Avg Role Fit Score")').first();
    await expect(avgCard).toBeVisible();
    await expect(avgCard.locator('..').locator('text=78%')).toBeVisible();
  });

  test('should display stats cards with correct values', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 25,
          averageRoleFitScore: 78,
          shortlistCount: 8,
          processingCount: 3,
          recentCandidates: [],
          shortlistedCandidates: []
        })
      });
    });

    await page.reload();
    
    // Check all stats cards by their headings
    await expect(page.locator('h3:has-text("Total Candidates")')).toBeVisible();
    await expect(page.locator('h3:has-text("Avg Role Fit Score")')).toBeVisible();
    await expect(page.locator('h3:has-text("Shortlisted")')).toBeVisible();
    await expect(page.locator('h3:has-text("Pending Reviews")')).toBeVisible();

    // Check numeric values inside the corresponding cards
    await expect(page.locator('h3:has-text("Shortlisted")').first().locator('..').locator('text=8')).toBeVisible();
    await expect(page.locator('h3:has-text("Pending Reviews")').first().locator('..').locator('text=3')).toBeVisible();
  });

  test('should display recent candidates list', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 25,
          averageRoleFitScore: 78,
          shortlistCount: 8,
          processingCount: 3,
          recentCandidates: [
            {
              name: 'John Doe',
              jobRole: 'Frontend Developer',
              createdAt: new Date().toISOString(),
              status: 'completed',
              roleFitScore: 85
            },
            {
              name: 'Jane Smith',
              jobRole: 'Backend Engineer',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              status: 'processing',
              roleFitScore: 72
            }
          ],
          shortlistedCandidates: []
        })
      });
    });

    await page.reload();

    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=Frontend Developer')).toBeVisible();
    await expect(page.locator('text=Backend Engineer')).toBeVisible();
  });

  test('should display quick action button for new evaluation', async ({ page }) => {
    const newEvalBlock = page.locator('div.rounded-xl.p-8.text-center.cursor-pointer:has(h3:has-text("New Evaluation"))').first();
    await expect(newEvalBlock).toBeVisible();
    await expect(newEvalBlock).toHaveClass(/cursor-pointer/);
  });

  test('should open evaluation modal when clicking new evaluation', async ({ page }) => {
    const newEvalBlock = page.locator('div.rounded-xl.p-8.text-center.cursor-pointer:has(h3:has-text("New Evaluation"))').first();
    await newEvalBlock.click();

    // Check if modal opens (EvaluationForm has input#job-role)
    await expect(page.locator('input#job-role')).toBeVisible();
  });

  test('should show loading state during data fetch', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 0,
          averageRoleFitScore: 0,
          shortlistCount: 0,
          processingCount: 0,
          recentCandidates: [],
          shortlistedCandidates: []
        })
      });
    });

    await page.reload();

    // Should show loading spinner initially (svg with animate-spin)
    await expect(page.locator('svg.animate-spin')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' })
      });
    });

    await page.reload();

    await expect(page.locator('h3:has-text("Error Loading Dashboard")')).toBeVisible();
    await expect(page.locator('text=Server error')).toBeVisible();
  });

  test('should display shortlisted candidates section', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 25,
          averageRoleFitScore: 78,
          shortlistCount: 2,
          processingCount: 3,
          recentCandidates: [],
          shortlistedCandidates: [
            {
              _id: '1',
              name: 'Alice Johnson',
              jobRole: 'Full Stack Developer',
              roleFitScore: 92,
              createdAt: new Date().toISOString()
            },
            {
              _id: '2', 
              name: 'Bob Wilson',
              jobRole: 'DevOps Engineer',
              roleFitScore: 88,
              createdAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    await page.reload();
    
    await expect(page.locator('h3:has-text("Alice Johnson")')).toBeVisible().catch(async () => {
      // Fallback: check by text if strict matching fails
      await expect(page.locator('text=Alice Johnson')).toBeVisible();
    });
    await expect(page.locator('text=Bob Wilson')).toBeVisible();
    await expect(page.locator('text=Full Stack Developer')).toBeVisible();
    await expect(page.locator('text=DevOps Engineer')).toBeVisible();
  });

  test('should display empty state when no data', async ({ page }) => {
    await page.route('**/api/dashboard*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCandidates: 0,
          averageRoleFitScore: 0,
          shortlistCount: 0,
          processingCount: 0,
          recentCandidates: [],
          shortlistedCandidates: []
        })
      });
    });

    await page.reload();
    
    await expect(page.locator('text=0').first()).toBeVisible(); // Total candidates
    await expect(page.locator('text=0%')).toBeVisible(); // Average score
  });
});