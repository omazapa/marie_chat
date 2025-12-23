const { chromium } = require('playwright');

async function createTestUser() {
  console.log('🚀 Creating Test user...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('📱 Opening Marie Chat...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/01-login-page.png' });
    console.log('✅ Login page loaded');

    // Fill login form with test credentials
    console.log('\n🔐 Logging in with test credentials...');
    console.log('   Email: test@example.com');
    console.log('   Password: ********');

    // Wait for form to be ready
    await page.waitForTimeout(1000);

    // Try different selectors for email input
    const emailSelector = 'input[type="email"], input[id*="email"], input[name*="email"]';
    await page.waitForSelector(emailSelector, { timeout: 5000 });
    await page.fill(emailSelector, 'test@example.com');

    // Try different selectors for password input
    const passwordSelector = 'input[type="password"], input[id*="password"], input[name*="password"]';
    await page.waitForSelector(passwordSelector, { timeout: 5000 });
    await page.fill(passwordSelector, 'poioiulkj');

    await page.screenshot({ path: 'test-results/02-form-filled.png' });

    // Click login button
    const submitButton = 'button[type="submit"], button:has-text("Login"), button:has-text("Ingresar")';
    await page.click(submitButton);
    
    console.log('⏳ Waiting for authentication...');
    await page.waitForTimeout(3000);

    // Check if redirected to chat
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/chat')) {
      await page.screenshot({ path: 'test-results/03-chat-page.png' });
      console.log('✅ Successfully logged in!');
      console.log('✅ Redirected to chat page');

      // Wait for chat interface to load
      await page.waitForTimeout(2000);

      // Check for connection status
      const connectionStatus = await page.textContent('text=/Connected|Disconnected/').catch(() => 'Unknown');
      console.log(`\n🔌 WebSocket Status: ${connectionStatus}`);

      // Try to create a conversation
      console.log('\n💬 Creating test conversation...');
      try {
        const newConvButton = 'button:has-text("New Conversation"), button:has-text("Start New Chat")';
        await page.waitForSelector(newConvButton, { timeout: 5000 });
        await page.click(newConvButton);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/04-new-conversation.png' });
        console.log('✅ Conversation created!');
      } catch (e) {
        console.log('⚠️ Could not create conversation (UI may not be fully loaded)');
      }

      console.log('\n🎉 SUCCESS! User is ready to use Marie Chat!');
      console.log('\n📧 Login Credentials:');
      console.log('   Email: test@example.com');
      console.log('   Password: poioiulkj');
      console.log('\n🌐 Access at: http://localhost:3000/login');

    } else {
      await page.screenshot({ path: 'test-results/03-login-failed.png' });
      console.log('❌ Login may have failed or redirected elsewhere');
      console.log(`Current page: ${currentUrl}`);

      // Check for error messages
      const bodyText = await page.textContent('body');
      if (bodyText.includes('error') || bodyText.includes('Invalid')) {
        console.log('❌ Error detected on page');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/error-screenshot.png' });
  } finally {
    console.log('\n⏸️  Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

createTestUser().catch(console.error);
