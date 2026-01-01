const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

test.describe('Rich Content & UX Suite', () => {
  let authToken = null;
  const TEST_USER = {
    email: 'ux_test@example.com',
    password: 'TestPass123!',
    full_name: 'UX Test User'
  };

  test.beforeAll(async ({ request }) => {
    console.log('🚀 Logging in test user...');
    
    // Try login
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.access_token;
      console.log('✅ User logged in successfully');
    } else {
      const loginError = await loginResponse.text();
      console.error(`❌ Login failed: ${loginError}`);
      throw new Error(`Failed to authenticate test user: ${loginError}`);
    }
    
    if (!authToken) {
      throw new Error('Auth token is null or undefined after login');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage and go to chat
    await page.goto(BASE_URL);
    await page.evaluate(({ token, user }) => {
      // Set legacy keys for AuthGuard hydration
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      // Set Zustand persist key
      const authState = {
        state: {
          user: user,
          accessToken: token,
          refreshToken: null,
          isAuthenticated: true,
          legacyHydrated: true
        },
        version: 0
      };
      localStorage.setItem('marie-auth-storage', JSON.stringify(authState));
    }, { token: authToken, user: { email: TEST_USER.email, full_name: TEST_USER.full_name } });
    
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForURL('**/chat', { timeout: 30000 });
    
    // Wait for the app to be ready
    await page.waitForSelector('.ant-layout', { timeout: 15000 });
    
    // Create new conversation to have a clean state
    const newConvBtn = page.getByRole('button', { name: 'New Conversation' });
    await expect(newConvBtn).toBeVisible({ timeout: 15000 });
    await newConvBtn.click();
    
    const input = page.getByPlaceholder('Type your message here...');
    await expect(input).toBeVisible({ timeout: 15000 });
    
    // If input is still disabled, it might be because of connection delay
    // Let's wait a bit more or check for connection status if we had a UI indicator
    await expect(input).toBeEnabled({ timeout: 45000 });
  });

  test('Markdown Rendering: Headers, Lists, and Formatting', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const markdownPrompt = `
# Header 1
## Header 2
### Header 3
**Bold Text**
*Italic Text*
> This is a blockquote
- List item 1
- List item 2
1. Ordered 1
2. Ordered 2
    `;
    
    await input.fill(markdownPrompt);
    await page.keyboard.press('Enter');

    // Wait for assistant response
    // We look for the last message bubble
    const lastMessage = page.locator('.ant-bubble').last();
    
    await expect(lastMessage.locator('h1')).toContainText('Header 1');
    await expect(lastMessage.locator('h2')).toContainText('Header 2');
    await expect(lastMessage.locator('h3')).toContainText('Header 3');
    await expect(lastMessage.locator('strong')).toContainText('Bold Text');
    await expect(lastMessage.locator('em')).toContainText('Italic Text');
    await expect(lastMessage.locator('blockquote')).toBeVisible();
    await expect(lastMessage.locator('ul > li')).toHaveCount(2);
    await expect(lastMessage.locator('ol > li')).toHaveCount(2);
  });

  test('Code Blocks: Syntax Highlighting, Copy, and Language Label', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const codePrompt = 'Genera un ejemplo de código en Python que use una clase y un decorador.';
    
    await input.fill(codePrompt);
    await page.keyboard.press('Enter');

    // Wait for code block
    const codeBlock = page.locator('.code-block-container').last();
    await expect(codeBlock).toBeVisible({ timeout: 60000 });

    // Check for language label
    const label = codeBlock.locator('text=PYTHON');
    await expect(label).toBeVisible();

    // Check for copy button
    const copyBtn = codeBlock.locator('button:has-text("Copy")');
    await expect(copyBtn).toBeVisible();

    // Test copy functionality
    await copyBtn.click();
    await expect(codeBlock.locator('button:has-text("Copied")')).toBeVisible();

    // Verify code content is present
    const code = codeBlock.locator('code');
    await expect(code).toBeVisible();
  });

  test('LaTeX Artifacts: Preview and Code Toggle', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    await input.fill('Escribe la ecuación de Schrödinger en un bloque LaTeX.');
    await page.keyboard.press('Enter');

    const latexCard = page.locator('.latex-artifact-card').last();
    await expect(latexCard).toBeVisible({ timeout: 60000 });

    // Check preview
    await expect(latexCard.locator('.katex-display')).toBeVisible();

    // Toggle to code - Use the tooltip or the icon class
    await latexCard.locator('.anticon-code').click();
    // Wait for pre block
    await expect(latexCard.locator('pre')).toBeVisible();
    
    // Toggle back to preview
    await latexCard.locator('.anticon-eye').click();
    await expect(latexCard.locator('.katex-display')).toBeVisible();
  });

  test('Interactive Tables: Sorting and CSV Download', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const tablePrompt = `
Genera una tabla con los siguientes datos:
| Nombre | Edad | Ciudad |
|--------|------|--------|
| Alice  | 30   | New York |
| Bob    | 25   | London |
| Charlie| 35   | Paris |
    `;
    
    await input.fill(tablePrompt);
    await page.keyboard.press('Enter');

    const tableContainer = page.locator('.markdown-table-container').last();
    await expect(tableContainer).toBeVisible({ timeout: 60000 });

    // Check for Ant Design Table
    await expect(tableContainer.locator('.ant-table')).toBeVisible();

    // Check for Download CSV button
    const downloadBtn = tableContainer.locator('button:has-text("Download CSV")');
    await expect(downloadBtn).toBeVisible();

    // Test sorting (click on "Edad" header)
    const ageHeader = tableContainer.locator('th:has-text("Edad")');
    await ageHeader.click();
    
    // Verify first row age (should be 25 after sort)
    const firstRowAge = tableContainer.locator('.ant-table-row').first().locator('td').nth(1);
    await expect(firstRowAge).toContainText('25');
  });

  test('HTML Artifacts: Iframe and Fullscreen', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    await input.fill('Genera un dashboard HTML simple con un gráfico SVG.');
    await page.keyboard.press('Enter');

    const htmlCard = page.locator('.ant-card').filter({ hasText: 'HTML Artifact' }).last();
    await expect(htmlCard).toBeVisible({ timeout: 60000 });

    // Check for iframe
    const iframe = htmlCard.locator('iframe');
    await expect(iframe).toBeVisible();

    // Check for fullscreen button
    const fullscreenBtn = htmlCard.locator('button').filter({ has: page.locator('.anticon-fullscreen') });
    await expect(fullscreenBtn).toBeVisible();
  });
});
