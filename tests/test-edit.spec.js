import { test, expect } from '@playwright/test';

test('Edit and resend message functionality', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder*="email"]', 'test@example.com');
  await page.fill('input[placeholder*="password"], input[placeholder*="contraseña"]', 'poioiulkj');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/chat', { timeout: 30000 });

  // Wait for loading state to disappear
  await expect(page.locator('text=Loading Chat...')).not.toBeVisible({ timeout: 30000 });

  await page.waitForTimeout(2000);

  const newConvButton = page.getByRole('button', { name: 'New Conversation' });
  await newConvButton.click();

  const input = page.getByPlaceholder('Type your message here...');
  await expect(input).toBeVisible();

  // Send first message
  await input.fill('What is the capital of France?');
  await page.keyboard.press('Enter');

  // Wait for response
  await page.waitForSelector('.ant-bubble-start:has-text("Paris")', { timeout: 60000 });
  await page.waitForTimeout(2000);

  // Find the user message and click edit
  const userBubble = page.locator('.ant-bubble-end').first();
  await userBubble.hover();
  const editButton = userBubble.locator('button').filter({ has: page.locator('.anticon-edit') });
  await editButton.click();

  // Check if input has the content and editing indicator is visible
  await expect(page.getByText('Editing message...')).toBeVisible();
  const editInput = page.getByPlaceholder('Edit your message...');
  await expect(editInput).toHaveValue('What is the capital of France?');

  // Change content and resend
  await editInput.fill('What is the capital of Italy?');

  // Click send button explicitly
  const sendButton = page.locator('button:has(.anticon-arrow-up)');
  await sendButton.click();

  // Wait for new response
  await page.waitForSelector('.ant-bubble-start:has-text("Rome")', { timeout: 30000 });

  // Verify that the old message is gone and the new one is there
  const messages = page.locator('.ant-bubble-content');
  // Should have 2 messages now (1 user, 1 assistant) because we truncated
  await expect(messages).toHaveCount(2);

  const lastUserMessage = await page.locator('.ant-bubble-end').last().innerText();
  expect(lastUserMessage).toContain('What is the capital of Italy?');

  console.log('Edit and resend functionality verified.');
});
