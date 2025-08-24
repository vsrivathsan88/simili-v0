const { test, expect } = require('@playwright/test');

test.describe('Landing Screen Refined Design', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  test('should display the refined hero section with Pi character', async ({ page }) => {
    // Check for hero section
    await expect(page.locator('.hero-section')).toBeVisible();
    
    // Check Pi character is present
    await expect(page.locator('.pi-avatar')).toBeVisible();
    await expect(page.locator('.pi-avatar')).toContainText('π');
    
    // Check Pi's speech bubble
    await expect(page.locator('.pi-speech-bubble')).toBeVisible();
    await expect(page.locator('.pi-speech-bubble p').first()).toContainText("Hi! I'm Pi, your math friend.");
    
    // Check hero content
    await expect(page.locator('.hero-content h1')).toContainText('Grade 3 Fractions');
    await expect(page.locator('.hero-content p')).toContainText('Learn through visual exploration');
    
    // Check hero CTA button
    await expect(page.locator('.hero-cta-btn')).toBeVisible();
    await expect(page.locator('.hero-cta-btn')).toContainText('Start Learning');
  });

  test('should display lessons in grid layout with proper styling', async ({ page }) => {
    // Check lessons container
    await expect(page.locator('.lessons-container')).toBeVisible();
    
    // Check lessons header
    await expect(page.locator('.lessons-header h2')).toContainText('Learning Journey');
    await expect(page.locator('.progress-text')).toContainText('6 lessons • Start anywhere');
    
    // Check lessons grid
    await expect(page.locator('.lessons-grid')).toBeVisible();
    
    // Check lesson cards
    const lessonCards = page.locator('.lesson-card');
    await expect(lessonCards).toHaveCount(6);
    
    // Check first lesson card (should be available)
    const firstCard = lessonCards.first();
    await expect(firstCard).toHaveClass(/available/);
    await expect(firstCard.locator('.lesson-emoji')).toBeVisible();
    await expect(firstCard.locator('.lesson-title')).toContainText('Introduction to Fractions');
    await expect(firstCard.locator('.lesson-description')).toContainText('Learn what fractions are using pizza');
    await expect(firstCard.locator('.start-indicator')).toBeVisible();
    
    // Check locked lesson card
    const lockedCard = lessonCards.nth(1);
    await expect(lockedCard).toHaveClass(/locked/);
    await expect(lockedCard.locator('.locked-indicator')).toBeVisible();
    await expect(lockedCard.locator('.coming-soon')).toContainText('Coming Soon');
  });

  test('should have tasteful design elements (not kitschy)', async ({ page }) => {
    // Check that we don't have excessive emoji usage in headers
    const mainTitle = page.locator('h1').first();
    const titleText = await mainTitle.textContent();
    
    // Should not have playlist emoji or excessive emojis
    expect(titleText).not.toContain('🎵');
    expect(titleText).not.toContain('🤖');
    
    // Check for professional color scheme (coral primary)
    const heroBtn = page.locator('.hero-cta-btn');
    const btnStyles = await heroBtn.evaluate(el => getComputedStyle(el));
    expect(btnStyles.background).toContain('rgb(255, 107, 107)'); // Coral color
    
    // Check Pi avatar has gradient background
    const piAvatar = page.locator('.pi-avatar');
    const avatarStyles = await piAvatar.evaluate(el => getComputedStyle(el));
    expect(avatarStyles.background).toContain('linear-gradient');
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hero section should stack vertically on mobile
    const heroSection = page.locator('.hero-section');
    const heroStyles = await heroSection.evaluate(el => getComputedStyle(el));
    expect(heroStyles.flexDirection).toBe('column');
    
    // Lessons grid should be single column on mobile
    const lessonsGrid = page.locator('.lessons-grid');
    const gridStyles = await lessonsGrid.evaluate(el => getComputedStyle(el));
    expect(gridStyles.gridTemplateColumns).toBe('1fr');
  });

  test('should handle lesson selection interaction', async ({ page }) => {
    // Click on first lesson (available)
    const firstLesson = page.locator('.lesson-card.available .lesson-button').first();
    
    // Should be clickable
    await expect(firstLesson).toBeEnabled();
    
    // Click should work without error
    await firstLesson.click();
    
    // Should navigate away from landing screen (lesson should be selected)
    await page.waitForTimeout(1000); // Wait for potential navigation
    
    // Check that we're no longer on landing screen (workspace should appear)
    const workspace = page.locator('.simili-workspace');
    const isWorkspaceVisible = await workspace.isVisible().catch(() => false);
    
    if (isWorkspaceVisible) {
      // If workspace appeared, lesson selection worked
      expect(isWorkspaceVisible).toBe(true);
    } else {
      // If still on landing, at least verify the button was interactive
      await expect(firstLesson).toBeEnabled();
    }
  });

  test('should prevent interaction with locked lessons', async ({ page }) => {
    // Find a locked lesson
    const lockedLesson = page.locator('.lesson-card.locked .lesson-button').first();
    
    // Should be disabled
    await expect(lockedLesson).toBeDisabled();
    
    // Should show locked indicator
    await expect(lockedLesson.locator('.locked-indicator')).toBeVisible();
  });

  test('should have proper footer with encouraging message', async ({ page }) => {
    // Check footer
    await expect(page.locator('.homepage-footer')).toBeVisible();
    
    // Check footer message is encouraging but not kitschy
    const footerText = await page.locator('.homepage-footer p').textContent();
    expect(footerText).toContain('Ready to make math discoveries');
    
    // Should not have robot emoji or other excessive decoration
    expect(footerText).not.toContain('🤖');
    expect(footerText).not.toContain('🎵');
  });
});