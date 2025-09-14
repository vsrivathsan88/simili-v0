import { test, expect } from '@playwright/test';

test.describe('Three-Act Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start the app
    await page.goto('http://localhost:3000');
    
    // Select a lesson
    await page.click('text=Parts & Wholes');
    
    // Wait for transition
    await page.waitForTimeout(3500);
    
    // Click through entry popup
    await page.click('text=Let\'s Start!');
  });

  test('should start in Act 1 (Spotlight mode)', async ({ page }) => {
    // Check for spotlight overlay
    await expect(page.locator('.spotlight-overlay')).toBeVisible();
    
    // Verify no tools are available
    await expect(page.locator('.floating-toolbar')).not.toBeVisible();
    
    // Canvas should be disabled
    const canvas = page.locator('canvas');
    await canvas.click();
    // TODO: Verify no drawing occurs
  });

  test('should transition to Act 2 when Pi calls set_lesson_act', async ({ page }) => {
    // Simulate Pi calling the tool
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('lesson-act-changed', {
        detail: {
          act: 'act2',
          toolsToUnlock: ['pencil', 'eraser', 'fractionBar', 'pizza'],
          timestamp: Date.now()
        }
      }));
    });
    
    // Check for transition animation
    await expect(page.locator('.act-transition-overlay')).toBeVisible();
    await expect(page.locator('text=Time to Explore!')).toBeVisible();
    
    // Wait for transition to complete
    await page.waitForTimeout(2500);
    
    // Verify Act 2 UI
    await expect(page.locator('.floating-toolbar')).toBeVisible();
    await expect(page.locator('.spotlight-overlay')).not.toBeVisible();
  });

  test('should allow drawing in Act 2', async ({ page }) => {
    // Transition to Act 2
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('lesson-act-changed', {
        detail: { act: 'act2', toolsToUnlock: ['pencil'], timestamp: Date.now() }
      }));
    });
    
    await page.waitForTimeout(2500);
    
    // Draw on canvas
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
    }
    
    // TODO: Verify stroke was created
  });

  test('should handle selection and deletion', async ({ page }) => {
    // Set up Act 2 with drawing
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('lesson-act-changed', {
        detail: { act: 'act2', toolsToUnlock: ['pencil'], timestamp: Date.now() }
      }));
    });
    await page.waitForTimeout(2500);
    
    // Draw something
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
    }
    
    // Switch to selection tool
    await page.click('button[title="Select"]');
    
    // Select the stroke
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 250, box.y + 250);
      await page.mouse.up();
    }
    
    // Delete with keyboard
    await page.keyboard.press('Delete');
    
    // TODO: Verify stroke was deleted
  });

  test('should show manipulatives in Act 2', async ({ page }) => {
    // Transition to Act 2
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('lesson-act-changed', {
        detail: { 
          act: 'act2', 
          toolsToUnlock: ['pencil', 'fractionBar', 'pizza'], 
          timestamp: Date.now() 
        }
      }));
    });
    
    await page.waitForTimeout(2500);
    
    // Click pizza button
    await page.click('text=Pizza');
    
    // Verify manipulative appears
    await expect(page.locator('.manipulative-container')).toBeVisible();
    
    // Test delete button on hover
    await page.hover('.manipulative-container');
    await expect(page.locator('.delete-btn')).toBeVisible();
    
    // Delete manipulative
    await page.click('.delete-btn');
    await expect(page.locator('.manipulative-container')).not.toBeVisible();
  });

  test('should transition to Act 3 (Showcase mode)', async ({ page }) => {
    // Transition to Act 3
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('lesson-act-changed', {
        detail: { act: 'act3', timestamp: Date.now() }
      }));
    });
    
    // Check for transition animation
    await expect(page.locator('text=Showcase Your Thinking!')).toBeVisible();
    
    await page.waitForTimeout(2500);
    
    // Verify Act 3 UI
    await expect(page.locator('.showcase-overlay')).toBeVisible();
    await expect(page.locator('.floating-toolbar')).not.toBeVisible();
  });
});

test.describe('Math Anxiety Detection', () => {
  test('should handle math anxiety events', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Simulate anxiety detection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('math-anxiety-detected', {
        detail: {
          id: 'test-anxiety-1',
          timestamp: Date.now(),
          anxietyLevel: 'high',
          indicators: ['repeated erasing', 'negative self-talk'],
          studentQuote: "I can't do this",
          recommendedApproach: 'temporary_funneling'
        }
      }));
    });
    
    // Could check for UI changes like encouragement messages
    // await expect(page.locator('.encouragement-message')).toBeVisible();
  });
});

test.describe('Tool Calls from Pi', () => {
  test('should handle reasoning step tracking', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Simulate Pi marking a reasoning step
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('reasoning-step-added', {
        detail: {
          id: 'step-1',
          timestamp: Date.now(),
          transcript: "I think 2 out of 6 blocks are blue",
          classification: 'correct',
          concepts: ['counting', 'fractions'],
          confidence: 0.9
        }
      }));
    });
    
    // If we had a teacher panel visible, we could verify it shows up
    // await expect(page.locator('.reasoning-trace')).toContainText('2 out of 6');
  });
});