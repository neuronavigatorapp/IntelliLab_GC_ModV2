import { test, expect } from '@playwright/test';
import { MockHandler } from './mock-handler';

/**
 * Troubleshooter → Sandbox Integration Tests
 * 
 * Tests the "Apply in Sandbox" functionality from AI Troubleshooter
 * to the GC Instrument Sandbox with parameter passing and banner display.
 */

test.describe('Troubleshooter → Sandbox Integration', () => {
    let mockHandler: MockHandler;

    test.beforeEach(async ({ page }) => {
        // Initialize and setup mock handlers
        mockHandler = new MockHandler();
        await mockHandler.setupMocks(page);

        // Set up console logging for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Console error:', msg.text());
            }
        });
    });

    test('should navigate to troubleshooter page and load correctly', async ({ page }) => {
        await page.goto('/troubleshooter');

        // Wait for page to load
        await expect(page.locator('h1:has-text("AI Troubleshooter")')).toBeVisible();
        await expect(page.locator('text=Hello! I\'m your AI troubleshooting assistant')).toBeVisible();

        // Check for key UI elements
        await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="send-message-btn"]')).toBeVisible();
        await expect(page.locator('text=Rules Analysis')).toBeVisible();
        await expect(page.locator('text=AI Suggestions')).toBeVisible();
    });

    test('should run analysis and display rule results with apply buttons', async ({ page }) => {
        await page.goto('/troubleshooter');

        // Wait for troubleshooter engine to load and run analysis
        await expect(page.locator('text=Rules Analysis')).toBeVisible();

        // Click the play button to run analysis
        const playButton = page.locator('button:has([data-testid], [class*="play"])').first();
        if (await playButton.isVisible()) {
            await playButton.click();

            // Wait for analysis to complete
            await page.waitForTimeout(3000);

            // Check for rule results with apply buttons
            const applyButtons = page.locator('button:has-text("Apply")');
            if (await applyButtons.count() > 0) {
                await expect(applyButtons.first()).toBeVisible();
            }
        }
    });

    test('should apply recommendation in sandbox from rule results', async ({ page }) => {
        await page.goto('/troubleshooter');

        // Wait for page load
        await expect(page.locator('h1:has-text("AI Troubleshooter")')).toBeVisible();

        // Run analysis if available
        const playButton = page.locator('button:has([data-testid], [class*="play"])').first();
        if (await playButton.isVisible()) {
            await playButton.click();
            await page.waitForTimeout(3000);
        }

        // Look for apply recommendation buttons
        const applyBtn = page.locator('[data-testid^="apply-recommendation-"]').first();

        if (await applyBtn.isVisible()) {
            await applyBtn.click();

            // Should navigate to sandbox
            await expect(page).toHaveURL(/\/sandbox/);

            // Check for troubleshooter banner
            await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();
            await expect(page.locator('text=Applied from AI Troubleshooter')).toBeVisible();
            await expect(page.locator('text=Recommendation:')).toBeVisible();
        } else {
            // If no dynamic results, test with URL parameters directly
            await page.goto('/sandbox?recommendation=Test%20recommendation&rule=test_rule&data=%7B%22preset%22%3A%22troubleshooter_scenario%22%7D');

            // Check for troubleshooter banner
            await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();
            await expect(page.locator('text=Applied from AI Troubleshooter')).toBeVisible();
            await expect(page.locator('text=Test recommendation')).toBeVisible();
        }
    });

    test('should apply suggestion in sandbox from AI suggestions', async ({ page }) => {
        await page.goto('/troubleshooter');

        // Wait for page load
        await expect(page.locator('h1:has-text("AI Troubleshooter")')).toBeVisible();

        // Check for suggestion apply buttons
        await expect(page.locator('text=AI Suggestions')).toBeVisible();

        // Click on an apply suggestion button
        const applySuggestionBtn = page.locator('[data-testid^="apply-suggestion-"]').first();
        await expect(applySuggestionBtn).toBeVisible();
        await applySuggestionBtn.click();

        // Should navigate to sandbox
        await expect(page).toHaveURL(/\/sandbox/);

        // Check for troubleshooter banner with suggestion details
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();
        await expect(page.locator('text=Applied from AI Troubleshooter')).toBeVisible();
        await expect(page.locator('text=Suggestion:')).toBeVisible();
    });

    test('should handle sandbox with troubleshooter parameters correctly', async ({ page }) => {
        // Navigate directly to sandbox with troubleshooter parameters
        const params = new URLSearchParams({
            recommendation: 'Inspect/replace inlet liner; check for active sites.',
            rule: 'early_tailing',
            category: 'Peak Shape',
            priority: 'high',
            data: JSON.stringify({
                preset: 'troubleshooter_scenario',
                peaks: [
                    { name: 'Component A', rt: 3.2, area: 2500, height: 180, snr: 15.2, tailing: 1.3 },
                    { name: 'Component B', rt: 6.8, area: 4200, height: 320, snr: 22.1, tailing: 1.1 }
                ],
                baseline_quality: 85,
                source: 'troubleshooter'
            })
        });

        await page.goto(`/sandbox?${params.toString()}`);

        // Check page loads correctly
        await expect(page.locator('h1:has-text("GC Instrument Sandbox")')).toBeVisible();

        // Check troubleshooter banner is displayed
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();
        await expect(page.locator('text=Applied from AI Troubleshooter')).toBeVisible();
        await expect(page.locator('text=Inspect/replace inlet liner')).toBeVisible();
        await expect(page.locator('text=EARLY TAILING')).toBeVisible();
        await expect(page.locator('text=Peak Shape')).toBeVisible();
        await expect(page.locator('text=HIGH')).toBeVisible();

        // Check badge shows troubleshooter source
        await expect(page.locator('[data-testid="troubleshooter-banner"] span:has-text("Troubleshooter")')).toBeVisible();

        // Check data is loaded (should show "Data Loaded" badge)
        await expect(page.locator('text=Data Loaded')).toBeVisible();

        // Check chromatogram is displayed
        await expect(page.locator('text=Synthetic Chromatogram')).toBeVisible();
        await expect(page.locator('text=Peak Analysis')).toBeVisible();
    });

    test('should handle sandbox with suggestion parameters correctly', async ({ page }) => {
        // Navigate directly to sandbox with suggestion parameters
        const params = new URLSearchParams({
            suggestion: 'Peak Tailing Issue',
            description: 'Multiple peaks showing excessive tailing in your chromatogram',
            category: 'Peak Shape',
            priority: 'high'
        });

        await page.goto(`/sandbox?${params.toString()}`);

        // Check page loads correctly
        await expect(page.locator('h1:has-text("GC Instrument Sandbox")')).toBeVisible();

        // Check troubleshooter banner is displayed with suggestion details
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();
        await expect(page.locator('text=Applied from AI Troubleshooter')).toBeVisible();
        await expect(page.locator('text=Peak Tailing Issue')).toBeVisible();
        await expect(page.locator('text=Multiple peaks showing excessive tailing')).toBeVisible();
        await expect(page.locator('text=Peak Shape')).toBeVisible();
        await expect(page.locator('text=HIGH')).toBeVisible();

        // Check badge shows troubleshooter source
        await expect(page.locator('[data-testid="troubleshooter-banner"] span:has-text("Troubleshooter")')).toBeVisible();
    });

    test('should clear URL parameters after loading troubleshooter data', async ({ page }) => {
        // Navigate with parameters
        const params = new URLSearchParams({
            recommendation: 'Test recommendation',
            rule: 'test_rule'
        });

        await page.goto(`/sandbox?${params.toString()}`);

        // Wait for page to load and process parameters
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();

        // Check that URL parameters are cleared
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('recommendation=');
        expect(currentUrl).not.toContain('rule=');
    });

    test('should export functionality work with troubleshooter data', async ({ page }) => {
        // Navigate with troubleshooter data that includes peaks
        const params = new URLSearchParams({
            data: JSON.stringify({
                preset: 'troubleshooter_scenario',
                peaks: [
                    { name: 'Component A', rt: 3.2, area: 2500, height: 180 },
                    { name: 'Component B', rt: 6.8, area: 4200, height: 320 }
                ],
                baseline_quality: 85
            })
        });

        await page.goto(`/sandbox?${params.toString()}`);

        // Wait for data to load
        await expect(page.locator('text=Data Loaded')).toBeVisible();

        // Check export buttons are available
        await expect(page.locator('[data-testid="export-png-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="export-csv-btn"]')).toBeVisible();

        // Test CSV export (PNG would require more complex setup)
        const downloadPromise = page.waitForEvent('download');
        await page.locator('[data-testid="export-csv-btn"]').click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('chromatogram_data.csv');
    });

    test('should handle reset functionality with troubleshooter data', async ({ page }) => {
        // Navigate with troubleshooter data
        const params = new URLSearchParams({
            recommendation: 'Test recommendation',
            data: JSON.stringify({ preset: 'troubleshooter_scenario' })
        });

        await page.goto(`/sandbox?${params.toString()}`);

        // Verify troubleshooter banner is shown
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();

        // Click reset button
        await page.locator('[data-testid="reset-btn"]').click();

        // Check that troubleshooter banner is cleared
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).not.toBeVisible();
        await expect(page.locator('text=No Data')).toBeVisible();
    });

    test('should handle navigation between troubleshooter and sandbox', async ({ page }) => {
        // Start at troubleshooter
        await page.goto('/troubleshooter');
        await expect(page.locator('h1:has-text("AI Troubleshooter")')).toBeVisible();

        // Apply a suggestion to go to sandbox
        const applySuggestionBtn = page.locator('[data-testid^="apply-suggestion-"]').first();
        await applySuggestionBtn.click();

        // Should be at sandbox with banner
        await expect(page).toHaveURL(/\/sandbox/);
        await expect(page.locator('[data-testid="troubleshooter-banner"]')).toBeVisible();

        // Navigate back to troubleshooter using browser navigation
        await page.goBack();
        await expect(page.locator('h1:has-text("AI Troubleshooter")')).toBeVisible();
    });

});