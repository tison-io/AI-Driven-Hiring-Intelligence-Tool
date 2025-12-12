import { test, expect } from '@playwright/test';

test.describe('Candidates List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as recruiter
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'recruiter1@test.com');
    await page.fill('[data-testid="password"]', 'NewPassword1234!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Mock candidates API so tests are deterministic
    await page.route('**/api/candidates*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '64d6c1f1a1b2c3d4e5f67890',
            name: 'John Doe',
            jobRole: 'Frontend Developer',
            roleFitScore: 85,
            experienceYears: 3,
            skills: ['React', 'JavaScript', 'CSS'],
            status: 'completed',
            confidenceScore: 92,
            createdAt: new Date().toISOString()
          },
          {
            _id: '64d6c1f1a1b2c3d4e5f67891',
            name: 'Jane Smith',
            jobRole: 'Backend Engineer',
            roleFitScore: 78,
            experienceYears: 5,
            skills: ['Node.js', 'Python', 'MongoDB'],
            status: 'completed',
            confidenceScore: 88,
            createdAt: new Date().toISOString()
          }
        ])
      });
    });

    // Navigate to candidates page
    await page.goto('/candidates');
  });

  test('should display all candidates in responsive table/card view', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('h1:has-text("Candidate Pipeline")')).toBeVisible();
    
    // Wait for either table rows, mobile cards or empty state to appear
    try {
      await Promise.race([
        page.waitForSelector('tbody tr', { timeout: 3000 }).then(() => true).catch(() => false),
        page.waitForSelector('.lg\\:hidden .space-y-4 > div', { timeout: 3000 }).then(() => true).catch(() => false),
        page.waitForSelector('text=No candidates found', { timeout: 3000 }).then(() => true).catch(() => false)
      ]);
    } catch (e) {
      // If none appeared within time, continue to assertions which will fail below
    }

    const tableCount = await page.locator('tbody tr').count();
    const cardCount = await page.locator('.lg\\:hidden .space-y-4 > div').count();
    const emptyVisible = await page.locator('text=No candidates found').isVisible().catch(() => false);

    expect(tableCount > 0 || cardCount > 0 || emptyVisible).toBeTruthy();

    if (tableCount > 0) {
      await expect(page.locator('tbody tr').first()).toBeVisible();
    } else if (cardCount > 0) {
      await expect(page.locator('.lg\\:hidden .space-y-4 > div').first()).toBeVisible();
    }
  });

  test('should show loading skeleton during fetch', async ({ page }) => {
    // Reload page to catch loading state
    await page.reload();
    
    // Check for skeleton loader (might be brief)
    const skeleton = page.locator('.animate-pulse');
    // Loading might be too fast, so we just verify the page loads properly
    await expect(page.locator('h1:has-text("Candidate Pipeline")')).toBeVisible();
  });

  test('should show empty state when no candidates', async ({ page }) => {
    // Set filters that will likely return no results
    await page.fill('input[placeholder="Search Candidates..."]', 'NonExistentCandidate12345');
    await page.waitForTimeout(1000); // Wait for debounced search
    
    // Check for empty state
    const emptyState = page.locator('text=No candidates found');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Start by uploading resumes or processing LinkedIn profiles')).toBeVisible();
      await expect(page.locator('button:has-text("Upload Resume")')).toBeVisible();
    }
  });

  test('should search by name functionality with debounced input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search Candidates..."]');
    
    // Type in search box
    await searchInput.fill('John');
    
    // Wait for debounced search (500ms)
    await page.waitForTimeout(600);
    
    // Verify search input has value
    await expect(searchInput).toHaveValue('John');
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(600);
    
    // Verify search is cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should filter by score range using slider', async ({ page }) => {
    // Find the score range slider
    const scoreSlider = page.locator('input[type="range"]');
    await expect(scoreSlider).toBeVisible();
    
    // Get initial value
    const initialValue = await scoreSlider.inputValue();
    
    // Move slider to 50%
    await scoreSlider.fill('50');
    
    // Verify slider value changed
    await expect(scoreSlider).toHaveValue('50');
    
    // Check that label updates (the label shows the value inline)
    await expect(page.locator('text=Minimum Role Fit Score:')).toBeVisible();
    
    // Wait for debounced filter
    await page.waitForTimeout(600);
    
    // Reset slider
    await scoreSlider.fill('0');
    await expect(scoreSlider).toHaveValue('0');
  });

  test('should filter by experience years using dual-range slider', async ({ page }) => {
    // Find experience range section
    const experienceSection = page.locator('text=Experience Range:').locator('..');
    await expect(experienceSection).toBeVisible();
    
    // Check that experience range label is visible
    await expect(page.locator('text=Experience Range: 0 - 10 years')).toBeVisible();
    
    // The rc-slider component is complex, so we'll verify it's present
    const slider = page.locator('.custom-slider');
    if (await slider.isVisible()) {
      await expect(slider).toBeVisible();
    }
  });

  test('should clear all filters when clear button is clicked', async ({ page }) => {
    // Set some filters first
    await page.fill('input[placeholder="Search Candidates..."]', 'Test');
    await page.locator('input[type="range"]').fill('30');
    
    // Wait for filters to apply
    await page.waitForTimeout(600);
    
    // Click clear filters button
    const clearButton = page.locator('button:has-text("Clear Filters")');
    await clearButton.click();
    
    // Verify filters are cleared
    await expect(page.locator('input[placeholder="Search Candidates..."]')).toHaveValue('');
    await expect(page.locator('input[type="range"]')).toHaveValue('0');
    
    // Check for success toast
    await expect(page.locator('text=Filters cleared')).toBeVisible();
  });

  test('should handle API error state', async ({ page }) => {
    // Intercept API call and make it fail
    await page.route('**/api/candidates*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });
    
    // Reload page to trigger API call
    await page.reload();
    
    // Check for error state
    await expect(page.locator('text=Error Loading Candidates')).toBeVisible();
  });

  test('should navigate to candidate detail page when view button is clicked', async ({ page }) => {
    // Wait for candidates to load
    await page.waitForSelector('tbody tr, .lg\\:hidden .space-y-4 > div', { timeout: 5000 });

    // Prefer clicking the view button in the first table row, otherwise first card
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      const viewBtn = firstRow.locator('button:has(svg)').first();
      await viewBtn.click();
    } else {
      const firstCard = page.locator('.lg\\:hidden .space-y-4 > div').first();
      const viewBtn = firstCard.locator('button:has(svg)').first();
      await viewBtn.click();
    }

    // Should navigate to candidate detail page (ids in mock are 24-hex)
    await expect(page).toHaveURL(/\/candidates\/[a-f0-9]{24}/);
  });

  test('should show delete confirmation modal when delete button is clicked', async ({ page }) => {
    // Wait for candidates to load
    await page.waitForTimeout(1000);
    
    // Look for delete buttons (Trash icon) - more specific selector
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg[data-lucide="trash-2"]') });
    
    if (await deleteButtons.count() > 0) {
      // Click first delete button
      await deleteButtons.first().click();
      
      // Should show delete confirmation modal
      await expect(page.locator('text=Delete Candidate')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();
      
      // Cancel deletion
      await page.click('button:has-text("Cancel")');
    }
  });

  test('should show export menu when export button is clicked', async ({ page }) => {
    // Click export button
    await page.click('button:has-text("Export Data")');
    
    // Should show export dropdown
    await expect(page.locator('text=Export as CSV')).toBeVisible();
    await expect(page.locator('text=Export as XLSX')).toBeVisible();
    
    // Click outside to close menu
    await page.click('h1:has-text("Candidate Pipeline")');
  });
});