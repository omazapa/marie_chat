const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

test.describe('Extreme Content & Stress Suite', () => {
  let authToken = null;
  const TEST_USER = {
    email: 'ux_test@example.com',
    password: 'TestPass123!',
    full_name: 'UX Test User'
  };

  test.beforeAll(async ({ request }) => {
    // Login existing user
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password }
    });
    const loginData = await loginResponse.json();
    authToken = loginData.access_token;
  });

  test.beforeEach(async ({ page }) => {
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
  });

  test('Extreme LaTeX: Multi-line and Complex Equations', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const extremeLatex = `
Aquí tienes una serie de ecuaciones extremadamente largas para probar el scroll y el renderizado:

$$
\\begin{aligned}
\\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\epsilon_0} \\\\
\\nabla \\cdot \\mathbf{B} &= 0 \\\\
\\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
\\nabla \\times \\mathbf{B} &= \\mu_0\\mathbf{J} + \\mu_0\\epsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t} \\\\
\\int_{\\partial \\Omega} \\mathbf{E} \\cdot d\\mathbf{S} &= \\frac{1}{\\epsilon_0} \\iiint_{\\Omega} \\rho dV \\\\
\\oint_C \\mathbf{E} \\cdot d\\mathbf{l} &= -\\frac{d}{dt} \\iint_S \\mathbf{B} \\cdot d\\mathbf{S} \\\\
L = \\sqrt{ (x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2 + (w_2-w_1)^2 + (v_2-v_1)^2 + (u_2-u_1)^2 } \\\\
P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_1 x + a_0 = \\sum_{i=0}^n a_i x^i \\\\
\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} = \\prod_{p \\text{ prime}} \\frac{1}{1-p^{-s}}
\\end{aligned}
$$
    `;
    
    await input.fill(extremeLatex);
    await page.keyboard.press('Enter');

    // Wait for the message to be processed and the artifact to appear
    const latexCard = page.locator('.latex-artifact-card').last();
    await expect(latexCard).toBeVisible({ timeout: 90000 });
    
    // Check if it overflows or if we can see the content
    const katex = latexCard.locator('.katex-display');
    await expect(katex).toBeVisible();
    
    // Take a snapshot to verify layout
    await page.screenshot({ path: 'tests/screenshots/extreme-latex.png' });
  });

  test('Extreme Code: Multiple Languages and Long Blocks', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const extremeCode = `
Prueba de múltiples lenguajes y bloques largos:

\`\`\`python
class LargeSystem:
    def __init__(self):
        self.data = [i for i in range(1000)]
        
    def process(self):
        # Un comentario muy largo para probar el wrap y el scroll horizontal en el editor de código de la interfaz de usuario
        return sum([x**2 for x in self.data if x % 2 == 0])

    def extra_long_method_name_to_test_how_it_looks_in_the_ui_when_we_have_very_long_identifiers(self):
        pass
\`\`\`

\`\`\`javascript
const complexUI = {
  render: () => {
    console.log("Rendering a very complex UI component with many nested properties and long strings to test the syntax highlighter performance");
    return Array.from({length: 100}).map((_, i) => \`Item \${i}\`);
  }
};
\`\`\`
    `;
    
    await input.fill(extremeCode);
    await page.keyboard.press('Enter');

    const codeBlocks = page.locator('.code-block-container');
    await expect(codeBlocks).toHaveCount(2, { timeout: 60000 });
    
    await page.screenshot({ path: 'tests/screenshots/extreme-code.png' });
  });

  test('Extreme HTML: Plotly.js and Large Content', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const plotlyPrompt = `
Genera un artefacto HTML que use Plotly.js desde un CDN para mostrar un gráfico 3D complejo.
Usa esta URL para Plotly: https://cdn.plot.ly/plotly-2.27.0.min.js
    `;
    
    await input.fill(plotlyPrompt);
    await page.keyboard.press('Enter');

    const htmlCard = page.locator('.html-artifact-card').last();
    await expect(htmlCard).toBeVisible({ timeout: 90000 });

    const iframe = htmlCard.locator('iframe');
    await expect(iframe).toBeVisible();
    
    // Wait for Plotly to render inside iframe
    // We can't easily check inside the iframe without more setup, but we can check if the iframe is large
    await page.screenshot({ path: 'tests/screenshots/extreme-plotly.png' });
  });

  test('Mixed Chaos: The Ultimate Stress Test', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message here...');
    const chaosPrompt = `
Genera un mensaje que contenga:
1. Un encabezado H1.
2. Una tabla de 5x5 con datos al azar.
3. Un bloque de código Rust.
4. Una ecuación LaTeX compleja.
5. Un artefacto HTML con un botón que cambie de color.
6. Una lista anidada de 3 niveles.
    `;
    
    await input.fill(chaosPrompt);
    await page.keyboard.press('Enter');

    // Wait for various elements
    await expect(page.locator('h1').last()).toBeVisible({ timeout: 120000 });
    await expect(page.locator('.ant-table').last()).toBeVisible({ timeout: 60000 });
    await expect(page.locator('.code-block-container').last()).toBeVisible({ timeout: 60000 });
    await expect(page.locator('.latex-artifact-card').last()).toBeVisible({ timeout: 60000 });
    await expect(page.locator('.html-artifact-card').last()).toBeVisible({ timeout: 60000 });
    
    await page.screenshot({ path: 'tests/screenshots/mixed-chaos.png' });
  });
});
