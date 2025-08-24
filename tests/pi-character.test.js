const { test, expect } = require('@playwright/test');

test.describe('Pi Character Image', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display Pi character image instead of π text', async ({ page }) => {
    // Check that Pi avatar container exists
    await expect(page.locator('.pi-avatar')).toBeVisible();
    
    // Check that the image is present and loaded
    const piImage = page.locator('.pi-avatar img');
    await expect(piImage).toBeVisible();
    
    // Check image src points to our character
    await expect(piImage).toHaveAttribute('src', '/assets/pi-character.png');
    
    // Check alt text is set correctly
    await expect(piImage).toHaveAttribute('alt', 'Pi, your learning companion');
    
    // Verify the image actually loaded (not broken)
    const imageNaturalWidth = await piImage.evaluate(img => img.naturalWidth);
    expect(imageNaturalWidth).toBeGreaterThan(0);
  });

  test('should have proper speech bubble positioned with the character', async ({ page }) => {
    // Check speech bubble is visible
    await expect(page.locator('.pi-speech-bubble')).toBeVisible();
    
    // Check speech bubble content
    await expect(page.locator('.pi-speech-bubble p').first())
      .toContainText("Hi! I'm Pi, your learning companion.");
    
    await expect(page.locator('.pi-speech-bubble p').last())
      .toContainText('Ready to discover something amazing?');
  });

  test('should have floating animation applied to Pi character', async ({ page }) => {
    const piAvatar = page.locator('.pi-avatar');
    
    // Check that the float-gentle class is applied (animation)
    const piAvatarClasses = await piAvatar.getAttribute('class');
    expect(piAvatarClasses).toContain('float-gentle');
  });
});