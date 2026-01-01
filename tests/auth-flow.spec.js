const { test, expect } = require('@playwright/test');

test.describe('Marie - Authentication and Chat', () => {
  
  test('Registration, Login and Chat access', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `user${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';
    
    console.log(`\n🔐 Testing with credentials:`);
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    // STEP 1: Registration
    console.log('\n📝 STEP 1: Registering user...');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/1-register-page.png' });
    
    // Wait for form to be visible
    await page.waitForSelector('form, input', { timeout: 10000 });
    
    // Fill form
    const allInputs = await page.locator('input').all();
    
    for (const input of allInputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      
      if (type === 'email' || name === 'email' || (placeholder && placeholder.toLowerCase().includes('email'))) {
        await input.fill(testEmail);
        console.log('✓ Email entered');
      } else if (type === 'password' || name === 'password') {
        await input.fill(testPassword);
        console.log('✓ Password entered');
      } else if (name === 'name' || (placeholder && (placeholder.toLowerCase().includes('name') || placeholder.toLowerCase().includes('nombre')))) {
        await input.fill(testName);
        console.log('✓ Name entered');
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/2-register-filled.png' });
    
    // Submit registration
    const registerButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register")').first();
    await registerButton.click();
    console.log('✓ Registration form submitted');
    
    // Wait for response
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/3-after-register.png' });
    
    const urlAfterRegister = page.url();
    console.log(`URL after registration: ${urlAfterRegister}`);
    
    // STEP 2: Login
    console.log('\n🔑 STEP 2: Logging in...');
    
    // If we're not on login, go there
    if (!urlAfterRegister.includes('/login') && !urlAfterRegister.includes('/chat')) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }
    
    // If we're already in chat, registration was successful and logged us in automatically
    if (!page.url().includes('/chat')) {
      await page.screenshot({ path: 'tests/screenshots/4-login-page.png' });
      
      // Fill login form
      const loginInputs = await page.locator('input').all();
      
      for (const input of loginInputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        
        if (type === 'email' || name === 'email' || (placeholder && placeholder.toLowerCase().includes('email'))) {
          await input.fill(testEmail);
          console.log('✓ Email entered in login');
        } else if (type === 'password' || name === 'password') {
          await input.fill(testPassword);
          console.log('✓ Password entered in login');
        }
      }
      
      await page.screenshot({ path: 'tests/screenshots/5-login-filled.png' });
      
      // Submit login
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
      await loginButton.click();
      console.log('✓ Login form submitted');
      
      // Wait for navigation to /chat
      await page.waitForURL('**/chat', { timeout: 15000 });
      console.log('✓ Redirected to /chat');
      
      await page.screenshot({ path: 'tests/screenshots/6-after-login.png' });
    } else {
      console.log('✓ Already logged in (automatic registration)');
    }
    
    const urlAfterLogin = page.url();
    console.log(`URL after login: ${urlAfterLogin}`);
    
    // STEP 3: Access chat
    console.log('\n💬 STEP 3: Accessing chat...');
    
    if (!urlAfterLogin.includes('/chat')) {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/7-chat-page.png' });
    
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    
    // Verifications
    console.log('\n✅ VERIFICATIONS:');
    
    // Must be on /chat
    expect(finalUrl).toContain('/chat');
    console.log('✓ We are on the chat page');
    
    // Must not be on login
    expect(finalUrl).not.toContain('/login');
    console.log('✓ We were not redirected to login');
    
    // Must have content on the page
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
    console.log('✓ The page has content');
    
    // Verify typical chat elements
    const hasInputArea = await page.locator('textarea, input[type="text"]').count();
    console.log(`✓ Text areas found: ${hasInputArea}`);
    
    const hasButtons = await page.locator('button').count();
    console.log(`✓ Buttons found: ${hasButtons}`);
    
    await page.screenshot({ path: 'tests/screenshots/8-chat-final.png' });
    
    console.log('\n🎉 COMPLETE FLOW SUCCESSFUL!\n');
  });
});
