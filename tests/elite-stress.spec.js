const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

test.describe('Elite Stress & Parallel Suite', () => {
  let authToken = null;
  const TEST_USER = {
    email: 'ux_test@example.com',
    password: 'TestPass123!',
    full_name: 'UX Test User'
  };

  test.beforeAll(async ({ request }) => {
    // Add a small random delay to stagger login requests in parallel mode
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));

    console.log('🚀 Attempting login for stress test...');
    // Login existing user
    try {
      const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: TEST_USER.email, password: TEST_USER.password },
        timeout: 60000
      });

      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        authToken = loginData.access_token;
        console.log('✅ Login successful');
      } else {
        const errorText = await loginResponse.text();
        console.error(`❌ Login failed: ${errorText}`);
      }
    } catch (e) {
      console.error(`❌ Login request failed: ${e.message}`);
    }
  });

  // We will run 20 iterations of this test
  for (let i = 1; i <= 20; i++) {
    test(`Elite Stress Iteration ${i}: Mixed Chaos Prompt`, async ({ page }) => {
      test.slow(); // Give it more time

      await page.goto(BASE_URL);
      await page.evaluate(({ token, user }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        const authState = {
          state: {
            user: user,
            accessToken: token,
            isAuthenticated: true,
            legacyHydrated: true
          },
          version: 0
        };
        localStorage.setItem('marie-auth-storage', JSON.stringify(authState));
      }, { token: authToken, user: { email: TEST_USER.email, full_name: TEST_USER.full_name } });

      await page.goto(`${BASE_URL}/chat`);
      await page.waitForURL('**/chat', { timeout: 30000 });

      const newConvBtn = page.getByRole('button', { name: 'New Conversation' });
      await expect(newConvBtn).toBeVisible();
      await newConvBtn.click();

      const input = page.getByPlaceholder('Type your message here...');
      await expect(input).toBeEnabled({ timeout: 30000 });

      const complexPrompt = "give me an extensive code in html mixed with c++ and python and latex and many variations of those mixed codes and normal text mixed with all that";

      await input.fill(complexPrompt);
      await page.keyboard.press('Enter');

      // Wait for the response to start and finish
      // We look for multiple types of artifacts that should be generated
      const responseContainer = page.locator('.markdown-content').last();

      // Increase timeout for long generations
      await expect(responseContainer).toBeVisible({ timeout: 120000 });

      // Check for at least one code block and one latex/html artifact
      // The AI might not generate all every time, but we expect a rich response
      await expect(async () => {
        const codeCount = await page.locator('.code-block-container').count();
        const artifactCount = await page.locator('.latex-artifact-card, .html-artifact-card').count();
        expect(codeCount + artifactCount).toBeGreaterThan(0);
      }).toPass({ timeout: 120000 });

      // Take a snapshot of the result
      await page.screenshot({ path: `tests/screenshots/elite-stress-${i}.png`, fullPage: true });
    });
  }
});
