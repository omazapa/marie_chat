import { test, expect } from '@playwright/test';

test.describe('Interface Preferences', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/chat');
  });

  test('user can access interface settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('http://localhost:3000/settings/interface');

    // Check if settings page loaded
    await expect(page.locator('h1')).toContainText(/Interface|Appearance/i);
  });

  test('user can change theme', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Select dark theme
    await page.click('input[value="dark"]');

    // Save preferences
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Verify dark theme is applied
    const bodyTheme = await page.evaluate(() => document.body.getAttribute('data-theme'));
    expect(bodyTheme).toBe('dark');
  });

  test('user can change language', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Change to Spanish
    await page.click('div[id*="language"]');
    await page.click('div[title="Español"]');

    // Save and wait for reload
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify Spanish is applied (check for Spanish text)
    await expect(page.locator('body')).toContainText(/Configuración|Interfaz/i);
  });

  test('user can toggle message density', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Select compact density
    await page.click('input[value="compact"]');

    // Save preferences
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Navigate to chat to verify
    await page.goto('http://localhost:3000/chat');

    // Check if messages have compact styling (smaller padding/font)
    const messageElement = page.locator('.ant-bubble').first();
    if (await messageElement.count() > 0) {
      const fontSize = await messageElement.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      // Compact should be 13px
      expect(parseInt(fontSize)).toBeLessThanOrEqual(13);
    }
  });

  test('user can toggle timestamps', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Find timestamp switch
    const timestampSwitch = page.locator('input[name="show_timestamps"]');

    // Toggle off
    await timestampSwitch.uncheck();

    // Save
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Navigate to chat
    await page.goto('http://localhost:3000/chat');

    // Verify timestamps are hidden
    const timestamps = page.locator('[type="secondary"]').filter({ hasText: /\d{1,2}:\d{2}/ });
    await expect(timestamps.first()).toBeHidden();
  });

  test('user can toggle markdown rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Disable markdown
    await page.locator('input[name="enable_markdown"]').uncheck();

    // Save
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Send a message with markdown to chat
    await page.goto('http://localhost:3000/chat');

    const markdownText = '**Bold** and *italic* text';
    await page.fill('textarea', markdownText);
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify markdown is NOT rendered (should see raw text)
    await expect(page.locator('.ant-bubble')).toContainText('**Bold**');
  });

  test('user can toggle code highlighting', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Disable code highlighting
    await page.locator('input[name="enable_code_highlighting"]').uncheck();

    // Save
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Go to chat and send code
    await page.goto('http://localhost:3000/chat');

    const code = '```python\\nprint("hello")\\n```';
    await page.fill('textarea', code);
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify SyntaxHighlighter is NOT used (plain pre/code tags)
    const codeBlock = page.locator('pre code');
    await expect(codeBlock).toBeVisible();

    // SyntaxHighlighter adds specific classes, plain code doesn't
    const hasHighlighting = await page.locator('[class*="language-"]').count();
    expect(hasHighlighting).toBe(0);
  });

  test('preferences persist across sessions', async ({ page, context }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Set specific preferences
    await page.click('input[value="light"]'); // Light theme
    await page.click('input[value="spacious"]'); // Spacious density
    await page.locator('input[name="show_timestamps"]').check();

    // Save
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Close and reopen browser (new context)
    await context.close();
    const newContext = await context.browser()?.newContext();
    const newPage = await newContext!.newPage();

    // Login again
    await newPage.goto('http://localhost:3000/login');
    await newPage.fill('input[type="email"]', 'test@example.com');
    await newPage.fill('input[type="password"]', 'password123');
    await newPage.click('button[type="submit"]');
    await newPage.waitForURL('**/chat');

    // Go to settings
    await newPage.goto('http://localhost:3000/settings/interface');

    // Verify preferences are loaded
    await expect(newPage.locator('input[value="light"]')).toBeChecked();
    await expect(newPage.locator('input[value="spacious"]')).toBeChecked();
    await expect(newPage.locator('input[name="show_timestamps"]')).toBeChecked();

    await newContext!.close();
  });

  test('auto theme mode follows system preference', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Select auto theme
    await page.click('input[value="auto"]');
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Check that theme matches system preference
    const systemPrefersDark = await page.evaluate(() =>
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    const bodyTheme = await page.evaluate(() =>
      document.body.getAttribute('data-theme')
    );

    expect(bodyTheme).toBe(systemPrefersDark ? 'dark' : 'light');
  });
});

test.describe('TTS/STT Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/chat');
  });

  test('user can select TTS voice', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Select Spanish voice
    await page.click('div[id*="tts_voice"]');
    await page.click('div[title*="Salome"]');

    // Save
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Verify it's saved (reload page)
    await page.reload();

    const selectedVoice = await page.locator('div[id*="tts_voice"]').textContent();
    expect(selectedVoice).toContain('Salome');
  });

  test('user can select STT language', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/interface');

    // Select Spanish STT
    await page.click('div[id*="stt_language"]');
    await page.click('div[title*="Spanish"]');

    // Save
    await page.click('button[type="submit"]');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

    // Verify persisted
    await page.reload();

    const selectedLang = await page.locator('div[id*="stt_language"]').textContent();
    expect(selectedLang).toContain('Spanish');
  });
});
