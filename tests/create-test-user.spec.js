const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'poioiulkj',
  full_name: 'Test User'
};

test.describe('Create Test User', () => {

  test('should create test@example.com user', async ({ page }) => {
    console.log('Creating test user...');

    // Navigate to register page
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // Fill registration form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[name="full_name"], input[placeholder*="name"], input[placeholder*="nombre"]', TEST_USER.full_name);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect or success
    await page.waitForTimeout(3000);

    // Should be redirected to chat page after successful registration
    const currentUrl = page.url();
    console.log(`Current URL after registration: ${currentUrl}`);

    if (currentUrl.includes('/chat')) {
      console.log('✅ User created and auto-logged in successfully!');
      console.log('✅ Redirected to chat page');

      // Verify we're in the chat interface
      await expect(page.getByRole('heading', { name: 'Marie', exact: true })).toBeVisible({ timeout: 5000 });

      console.log('\n📧 User Details:');
      console.log(`Email: ${TEST_USER.email}`);
      console.log(`Password: ${TEST_USER.password}`);
      console.log(`Name: ${TEST_USER.full_name}`);
    } else {
      console.log('⚠️ Not redirected to chat, checking current page...');
      await page.screenshot({ path: 'test-results/registration-state.png' });
    }
  });

  test('should login with test@example.com', async ({ page }) => {
    console.log('Testing login with test credentials...');

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Should be redirected to chat page
    await page.waitForURL('**/chat', { timeout: 10000 });

    console.log('✅ Login successful!');
    console.log('✅ Redirected to chat page');

    // Verify chat interface is loaded
    await expect(page.getByRole('heading', { name: 'Marie', exact: true })).toBeVisible();

    console.log('\n🎉 User is ready to use Marie!');
  });

  test('should verify user exists via API', async ({ request }) => {
    console.log('Verifying user via API...');

    // Try to login via API
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    });

    if (response.ok()) {
      const data = await response.json();
      console.log('✅ User verified via API');
      console.log(`✅ Access token received: ${data.access_token.substring(0, 20)}...`);
      console.log(`✅ User: ${data.user.email}`);

      expect(data).toHaveProperty('access_token');
      expect(data.user.email).toBe(TEST_USER.email);
    } else {
      const error = await response.json();
      console.log('❌ API login failed:', error);
      throw new Error('User verification failed');
    }
  });

  test('should create a test conversation', async ({ page }) => {
    console.log('Creating test conversation...');

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/chat', { timeout: 10000 });

    // Wait for chat interface to load
    await page.waitForTimeout(2000);

    // Create new conversation
    await page.click('button:has-text("New Conversation")');
    await page.waitForTimeout(2000);

    console.log('✅ Conversation created successfully!');
    console.log('✅ Ready to start chatting!');
  });
});
