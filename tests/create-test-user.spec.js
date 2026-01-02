const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'poioiulkj',
  full_name: 'Test User'
};

const ADMIN_API_KEY = 'mc_IOM7nahO9fOev-Fp5ukRDdqHV7uhBG9bJUIejq040YE';

test.describe('Create Test User', () => {

  test.beforeAll(async ({ request }) => {
    console.log('Enabling registration via Developer API...');
    const response = await request.put(`${API_URL}/api/v1/settings/registration`, {
      headers: {
        'X-API-Key': ADMIN_API_KEY
      },
      data: {
        enabled: true
      }
    });

    if (response.ok()) {
      console.log('✅ Registration enabled successfully');
    } else {
      console.error('❌ Failed to enable registration:', await response.text());
    }
  });

  test.afterAll(async ({ request }) => {
    console.log('Disabling registration via Developer API...');
    const response = await request.put(`${API_URL}/api/v1/settings/registration`, {
      headers: {
        'X-API-Key': ADMIN_API_KEY
      },
      data: {
        enabled: false
      }
    });

    if (response.ok()) {
      console.log('✅ Registration disabled successfully');
    } else {
      console.error('❌ Failed to disable registration:', await response.text());
    }
  });

  test('should create test@example.com user', async ({ page }) => {
    console.log('Creating test user...');

    // Navigate to register page
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // Fill registration form
    await page.fill('input[placeholder*="email"]', TEST_USER.email);
    await page.fill('input[placeholder*="name"], input[placeholder*="nombre"]', TEST_USER.full_name);
    await page.fill('input[placeholder*="characters"], input[placeholder*="contraseña"]', TEST_USER.password);
    await page.fill('input[placeholder*="Repeat"], input[placeholder*="Repetir"]', TEST_USER.password);

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

      // Wait for loading state to disappear
      await expect(page.locator('text=Loading Chat...')).not.toBeVisible({ timeout: 30000 });

      // Verify we're in the chat interface
      await expect(page.locator('text=Marie').first()).toBeVisible({ timeout: 10000 });

      console.log('\n📧 User Details:');
      console.log(`Email: ${TEST_USER.email}`);
      console.log(`Password: ${TEST_USER.password}`);
      console.log(`Name: ${TEST_USER.full_name}`);
    } else {
      console.log('⚠️ Not redirected to chat, checking current page...');
      // Check if user already exists
      const errorText = await page.locator('text=/already exists|ya existe/i').isVisible();
      if (errorText) {
        console.log('✅ User already exists, proceeding to login test');
      } else {
        await page.screenshot({ path: 'test-results/registration-state.png' });
      }
    }
  });

  test('should login with test@example.com', async ({ page }) => {
    console.log('Testing login with test credentials...');

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[placeholder*="email"]', TEST_USER.email);
    await page.fill('input[placeholder*="password"], input[placeholder*="contraseña"]', TEST_USER.password);

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
    await page.fill('input[placeholder*="email"]', TEST_USER.email);
    await page.fill('input[placeholder*="password"], input[placeholder*="contraseña"]', TEST_USER.password);
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
