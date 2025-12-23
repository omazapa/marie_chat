const { test, expect } = require('@playwright/test');

test.describe('Marie - Frontend', () => {
  
  test('Home page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Marie/i);
    
    // Take screenshot for reference
    await page.screenshot({ path: 'tests/screenshots/homepage.png' });
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Verify fields exist
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'tests/screenshots/login-page.png' });
  });

  test('Registration page is accessible', async ({ page }) => {
    await page.goto('/register');
    
    await page.waitForLoadState('networkidle');
    
    // Verify form fields are present
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'tests/screenshots/register-page.png' });
  });

  test('Navigation between pages works', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to login if there's a link
    const loginLink = page.locator('a[href*="login"], button:has-text("login")').first();
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForURL('**/login');
      await expect(page).toHaveURL(/login/);
    }
  });

  test('Frontend responds with status code 200', async ({ request }) => {
    const response = await request.get('http://localhost:3000');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('Static assets load correctly', async ({ page }) => {
    const responses = [];
    
    page.on('response', response => {
      if (response.url().includes('/_next/')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify there are no 404 or 500 errors in assets
    const errors = responses.filter(r => r.status >= 400);
    expect(errors.length).toBe(0);
  });
});
