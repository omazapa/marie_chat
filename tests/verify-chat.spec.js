import { test, expect } from '@playwright/test';

test('Chat functionality and artifacts rendering', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder*="email"]', 'test@example.com');
  await page.fill('input[placeholder*="password"], input[placeholder*="contraseña"]', 'poioiulkj');
  await page.click('button[type="submit"]');

  // Wait for navigation to chat
  await page.waitForURL('**/chat', { timeout: 30000 });

  // Wait for loading state to disappear
  await expect(page.locator('text=Loading Chat...')).not.toBeVisible({ timeout: 30000 });

  // Give it a moment to load conversations
  await page.waitForTimeout(5000);

  // 2. Create a new conversation
  const newConvButton = page.getByRole('button', { name: 'New Conversation' });
  await newConvButton.click();

  // Wait for the input to be visible (it appears when a conversation is selected)
  const input = page.getByPlaceholder('Type your message here...');
  await expect(input).toBeVisible({ timeout: 15000 });

  // 3. Send a message for LaTeX
  console.log('Step 3: Testing LaTeX...');
  await input.fill('Show the relativity formula in LaTeX using $$ blocks');
  await page.keyboard.press('Enter');

  // 4. Verify LaTeX rendering (KaTeX)
  await page.waitForSelector('.katex', { timeout: 60000 });
  console.log('LaTeX rendered successfully.');

  // 5. Send a message for HTML Artifact
  console.log('Step 5: Testing HTML Artifact...');
  await input.fill('Generate an HTML code block (using ```html) containing a button with id "test-button".');
  await page.keyboard.press('Enter');

  // Wait for the artifact container to appear
  await page.waitForSelector('.html-artifact', { timeout: 60000 });
  console.log('HTML Artifact rendered successfully.');
});
