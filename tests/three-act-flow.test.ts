import { test, expect } from '@playwright/test';

test.describe('Three-Act Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start the app
    await page.goto('http://localhost:3000');
    
    // Start featured lesson
    await page.click('.start-lesson-btn');
    
    // Wait for entry popup and start
    await expect(page.locator('.lesson-entry-overlay')).toBeVisible();
    await page.click('.start-adventure-btn');
  });

  test('should start in Act 1 (Spotlight mode)', async ({ page }) => {
    // Act 1 transition might display briefly
    await page.waitForTimeout(800);
    // In Act 1, toolbar should not be visible
    await expect(page.locator('.floating-toolbar')).not.toBeVisible();
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
    await page.click('button[title="Pizza"]');
    
    // Verify manipulative appears
    await expect(page.locator('.manipulative-stamp')).toBeVisible();
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
    
    // Verify Act 3 UI (toolbar hidden)
    await expect(page.locator('.floating-toolbar')).not.toBeVisible();
  });
});

test.describe('Tool Calls from Pi', () => {
  test('should handle reasoning step tracking event', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('.start-lesson-btn');
    await expect(page.locator('.lesson-entry-overlay')).toBeVisible();
    await page.click('.start-adventure-btn');
    
    // Simulate Pi marking a reasoning step (UI check would go to teacher panel)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('reasoning-step-added', {
        detail: {
          id: 'step-1',
          timestamp: Date.now(),
          transcript: 'I think 2 out of 6 blocks are blue',
          classification: 'correct',
          concepts: ['counting', 'fractions'],
          confidence: 0.9
        }
      }));
    });
    await page.waitForTimeout(200);
  });
});