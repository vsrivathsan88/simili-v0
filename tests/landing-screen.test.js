const { test, expect } = require('@playwright/test');

test.describe('Landing Screen - Lesson Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.simili-title', { timeout: 15000 });
  });

  test('should display lesson homepage with Pi and start button', async ({ page }) => {
    await expect(page.locator('.lesson-homepage')).toBeVisible();

    // Pi avatar and image
    await expect(page.locator('.pi-avatar img')).toBeVisible();
    await expect(page.locator('.pi-avatar img')).toHaveAttribute('alt', 'Pi, your learning companion');

    // Start button
    const startBtn = page.locator('.start-lesson-btn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText("Let's Go!");
  });

  test('should allow starting the featured lesson', async ({ page }) => {
    const startBtn = page.locator('.start-lesson-btn');
    if (await startBtn.count() === 0) {
      await page.click('text=Let\'s Go!');
    } else {
      await startBtn.click();
    }
    // Entry popup should appear
    await expect(page.locator('.lesson-entry-overlay')).toBeVisible();
  });
});