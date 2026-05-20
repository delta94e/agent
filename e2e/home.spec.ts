import { test, expect } from '@playwright/test';

test.describe('MAOP Home Page', () => {
  test('should load the 3D canvas and control panel', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');

    // Canvas should exist
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Control panel toggle button should be visible
    const toggleBtn = page.locator('button').filter({ hasText: /[✕☰]/ }).first();
    await expect(toggleBtn).toBeVisible();
  });

  test('should display HUD with metrics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // HUD should show TOTAL TOKENS label
    const tokenLabel = page.getByText('TOTAL TOKENS');
    await expect(tokenLabel).toBeVisible({ timeout: 10000 });
  });

  test('should toggle control panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click MAOP CONTROL header to confirm panel is open
    const panelHeader = page.getByText('MAOP');
    await expect(panelHeader.first()).toBeVisible({ timeout: 10000 });

    // Click close button
    const closeBtn = page.locator('button').filter({ hasText: '✕' }).first();
    await closeBtn.click();

    // Wait for panel to animate out
    await page.waitForTimeout(500);

    // Click hamburger to reopen
    const openBtn = page.locator('button').filter({ hasText: '☰' }).first();
    await openBtn.click();
    await page.waitForTimeout(500);

    // Panel should be visible again
    await expect(panelHeader.first()).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click METRICS tab
    const metricsTab = page.getByText('METRICS', { exact: true });
    await metricsTab.click();

    // Should show metric cards
    const tokenCard = page.getByText('TOTAL TOKENS');
    await expect(tokenCard).toBeVisible();

    // Click LOGS tab
    const logsTab = page.getByText('LOGS', { exact: true });
    await logsTab.click();

    // Should show log entries (source names)
    await page.waitForTimeout(1000);
    const logEntry = page.locator('text=/orchestrator|coach|aggregator/').first();
    await expect(logEntry).toBeVisible({ timeout: 5000 });
  });
});
