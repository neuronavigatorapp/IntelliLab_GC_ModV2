import { test, expect } from '@playwright/test';

test.describe('Troubleshooter Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/troubleshooter');
  });

  test('troubleshooter loads with initial state', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2, h3').first()).toContainText('AI Troubleshooter');
    
    // Verify initial welcome message
    await expect(page.getByText('Hello! I\'m your GC troubleshooting assistant')).toBeVisible();
    
    // Verify input components
    await expect(page.getByTestId('message-input')).toBeVisible();
    await expect(page.getByTestId('send-message-btn')).toBeVisible();
    
    // Send button should be disabled when input is empty
    await expect(page.getByTestId('send-message-btn')).toBeDisabled();
  });

  test('message sending workflow', async ({ page }) => {
    // Mock troubleshooter API
    await page.route('/api/troubleshooter/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Based on your description, I recommend checking the following:\n\n1. **Column Condition**: Verify column temperature and conditioning\n2. **Sample Preparation**: Ensure consistent sample matrix\n3. **Injection Parameters**: Check injection volume and temperature',
          recommendations: [
            'Check column temperature stability',
            'Verify sample preparation consistency',
            'Review injection parameters'
          ],
          severity: 'medium'
        })
      });
    });
    
    // Type a message
    const messageInput = page.getByTestId('message-input');
    await messageInput.fill('I\'m seeing peak tailing in my chromatogram');
    
    // Send button should now be enabled
    await expect(page.getByTestId('send-message-btn')).toBeEnabled();
    
    // Send the message
    await page.getByTestId('send-message-btn').click();
    
    // Should show user message
    await expect(page.getByText('I\'m seeing peak tailing')).toBeVisible();
    
    // Should show AI response
    await expect(page.getByText('Column Condition')).toBeVisible();
    await expect(page.getByText('Sample Preparation')).toBeVisible();
    await expect(page.getByText('Injection Parameters')).toBeVisible();
    
    // Input should be cleared
    expect(await messageInput.inputValue()).toBe('');
  });

  test('OCR context integration from URL parameters', async ({ page }) => {
    // Navigate with OCR context
    const ocrContext = {
      peaks: [
        { name: 'Peak 1', retention_time: 2.5, area: 150000, snr: 8.2, tailing_factor: 2.1 },
        { name: 'Peak 2', retention_time: 4.2, area: 220000, snr: 12.5, tailing_factor: 1.3 }
      ],
      baseline: { quality_score: 72, drift: 0.5 },
      overall_quality: 68,
      recommendations: ['Check column conditioning'],
      troubleshooting_suggestions: ['Peak tailing detected']
    };
    
    const encodedContext = encodeURIComponent(JSON.stringify(ocrContext));
    await page.goto(`/troubleshooter?context=${encodedContext}`);
    
    // Should show OCR context banner
    await expect(page.getByText('OCR Analysis Context Loaded')).toBeVisible();
    await expect(page.getByText('2 peaks')).toBeVisible();
    await expect(page.getByText('68% overall quality')).toBeVisible();
    
    // Should show pre-seeded analysis message
    await expect(page.getByText('Analysis Summary')).toBeVisible();
    await expect(page.getByText('Overall Quality: 68%')).toBeVisible();
    await expect(page.getByText('Peak Count: 2')).toBeVisible();
    await expect(page.getByText('Average S/N Ratio: 10.4')).toBeVisible();
  });

  test('quick suggestion buttons work', async ({ page }) => {
    // Look for quick suggestion buttons
    const suggestionButtons = page.locator('button').filter({ hasText: /peak.*tailing|baseline.*drift|retention.*shift/i });
    
    const firstSuggestion = suggestionButtons.first();
    if (await firstSuggestion.isVisible()) {
      await firstSuggestion.click();
      
      // Should populate message input with the suggestion
      const messageInput = page.getByTestId('message-input');
      const inputValue = await messageInput.inputValue();
      expect(inputValue.length).toBeGreaterThan(0);
      
      // Send button should be enabled
      await expect(page.getByTestId('send-message-btn')).toBeEnabled();
    }
  });

  test('conversation history is maintained', async ({ page }) => {
    // Mock API responses
    await page.route('/api/troubleshooter/analyze', async (route) => {
      const requestBody = await route.request().postDataJSON();
      const message = requestBody.message;
      
      let response = 'Generic response';
      if (message.includes('peak tailing')) {
        response = 'Peak tailing can be caused by column degradation or improper temperature.';
      } else if (message.includes('baseline drift')) {
        response = 'Baseline drift is often due to temperature instability or contamination.';
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: response,
          recommendations: ['Check relevant parameters'],
          severity: 'medium'
        })
      });
    });
    
    // Send first message
    await page.getByTestId('message-input').fill('I have peak tailing issues');
    await page.getByTestId('send-message-btn').click();
    
    await expect(page.getByText('peak tailing issues')).toBeVisible();
    await expect(page.getByText('column degradation')).toBeVisible();
    
    // Send second message
    await page.getByTestId('message-input').fill('I also see baseline drift');
    await page.getByTestId('send-message-btn').click();
    
    await expect(page.getByText('baseline drift')).toBeVisible();
    await expect(page.getByText('temperature instability')).toBeVisible();
    
    // Both messages and responses should be visible
    await expect(page.getByText('peak tailing issues')).toBeVisible();
    await expect(page.getByText('baseline drift')).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/troubleshooter/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service unavailable'
        })
      });
    });
    
    await page.getByTestId('message-input').fill('Test error handling');
    await page.getByTestId('send-message-btn').click();
    
    // Should show error message
    await expect(page.getByText(/Error|Sorry|unable to process/i)).toBeVisible();
    
    // Input should still be functional
    await expect(page.getByTestId('message-input')).toBeEnabled();
    await expect(page.getByTestId('send-message-btn')).toBeEnabled();
  });

  test('enter key sends message', async ({ page }) => {
    // Mock API response
    await page.route('/api/troubleshooter/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Response sent via Enter key',
          recommendations: [],
          severity: 'low'
        })
      });
    });
    
    const messageInput = page.getByTestId('message-input');
    await messageInput.fill('Testing Enter key functionality');
    
    // Press Enter
    await messageInput.press('Enter');
    
    // Should send the message
    await expect(page.getByText('Testing Enter key functionality')).toBeVisible();
    await expect(page.getByText('Response sent via Enter key')).toBeVisible();
  });

  test('loading state during message processing', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/troubleshooter/analyze', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Delayed response for testing',
          recommendations: [],
          severity: 'low'
        })
      });
    });
    
    await page.getByTestId('message-input').fill('Test loading state');
    await page.getByTestId('send-message-btn').click();
    
    // Should show loading indicator
    await expect(page.getByTestId('send-message-btn')).toBeDisabled();
    
    // May show typing indicator or loading message
    const loadingIndicator = page.locator('text=typing..., text=processing..., .loading, .spinner').first();
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    // Wait for response
    await expect(page.getByText('Delayed response for testing')).toBeVisible({ timeout: 15000 });
    
    // Button should be re-enabled
    await expect(page.getByTestId('send-message-btn')).toBeEnabled();
  });

  test('context URL parameters are cleaned up', async ({ page }) => {
    // Navigate with context
    const context = { peaks: [{ name: 'Test', retention_time: 1.0 }] };
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    await page.goto(`/troubleshooter?context=${encodedContext}`);
    
    // Verify context banner appears
    await expect(page.getByText('OCR Analysis Context Loaded')).toBeVisible();
    
    // URL should be cleaned up
    await expect(page).toHaveURL('/troubleshooter');
  });

  test('handles invalid context data gracefully', async ({ page }) => {
    // Navigate with malformed context
    await page.goto('/troubleshooter?context=invalid-json');
    
    // Should not crash and should show normal state
    await expect(page.getByText('Hello! I\'m your GC troubleshooting assistant')).toBeVisible();
    
    // No context banner should appear
    await expect(page.getByText('OCR Analysis Context Loaded')).not.toBeVisible();
  });

  test('mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should be functional on mobile
    await expect(page.getByTestId('message-input')).toBeVisible();
    await expect(page.getByTestId('send-message-btn')).toBeVisible();
    
    // Test sending a message on mobile
    await page.route('/api/troubleshooter/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Mobile response test',
          recommendations: [],
          severity: 'low'
        })
      });
    });
    
    await page.getByTestId('message-input').fill('Mobile test message');
    await page.getByTestId('send-message-btn').click();
    
    await expect(page.getByText('Mobile test message')).toBeVisible();
    await expect(page.getByText('Mobile response test')).toBeVisible();
  });
});