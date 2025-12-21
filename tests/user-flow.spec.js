const { test, expect } = require('@playwright/test');

test.describe('Marie Chat - User Flow', () => {
  
  test('Complete flow: New user registration', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';
    
    // Wait for form to be visible
    await page.waitForSelector('form, input', { timeout: 10000 });
    
    // Fill registration form - search inputs broadly
    const allInputs = await page.locator('input').all();
    
    // Identify inputs by order or attributes
    for (const input of allInputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      
      if (type === 'email' || name === 'email' || (placeholder && placeholder.toLowerCase().includes('email'))) {
        await input.fill(testEmail);
      } else if (type === 'password' || name === 'password') {
        await input.fill(testPassword);
      } else if (name === 'name' || (placeholder && (placeholder.toLowerCase().includes('name') || placeholder.toLowerCase().includes('nombre')))) {
        await input.fill(testName);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/registration-form-filled.png' });
    
    // Try to submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("register"), button:has-text("registrar")').first();
    await submitButton.click();
    
    // Wait for response (can be redirect or message)
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tests/screenshots/registration-after-submit.png' });
  });

  test('Try to access chat without authentication', async ({ page }) => {
    await page.goto('/chat');
    
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login or show authentication message
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('URL after trying to access /chat:', url);
    
    await page.screenshot({ path: 'tests/screenshots/chat-without-auth.png' });
    
    // Verify it's on login or there's an authentication message
    const isLoginPage = url.includes('/login');
    const hasAuthMessage = await page.locator('text=/login|sign in|autenticación|authenticate/i').count() > 0;
    
    expect(isLoginPage || hasAuthMessage).toBeTruthy();
  });

  test('Verify user interface elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify there's content on the page
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(0);
    
    // Verify React/Next.js loaded correctly by finding the main app div
    const appRoot = await page.locator('body > div').first().count();
    expect(appRoot).toBeGreaterThan(0);
    
    // Verify there are interactive elements
    const hasButtons = await page.locator('button, a').count();
    expect(hasButtons).toBeGreaterThan(0);
  });
});
