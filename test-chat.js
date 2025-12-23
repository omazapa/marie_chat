const { chromium } = require('playwright');

async function testChat() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
  });

  // Capture errors
  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]:', err.message);
  });

  // Capture network requests
  page.on('requestfailed', request => {
    console.error('[NETWORK FAILED]:', request.url(), request.failure()?.errorText);
  });

  try {
    console.log('🚀 Testing Marie Chat with full debugging...\n');

    // Login
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    console.log('📝 Filling login form...');
    await page.fill('input[placeholder*="email" i]', 'test@example.com');
    await page.fill('input[placeholder*="password" i]', 'poioiulkj');
    
    console.log('🔐 Submitting login...');
    await page.click('button:has-text("Sign in")');
    
    console.log('⏳ Waiting for redirect...');
    await page.waitForURL('**/chat', { timeout: 10000 });
    console.log('✅ Logged in successfully\n');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check connection status
    const statusText = await page.locator('text=/Connected|Disconnected/').textContent();
    console.log(`🔌 WebSocket Status: ${statusText}\n`);

    // Try to create new conversation
    console.log('💬 Looking for "Start New Chat" button...');
    const startButton = await page.locator('button:has-text("Start New Chat")').first();
    
    if (await startButton.isVisible()) {
      console.log('✅ Found button, clicking...');
      await startButton.click();
      console.log('⏳ Waiting for conversation creation...');
      await page.waitForTimeout(3000);
      
      // Check if conversation was created
      const hasConversations = await page.locator('text="No conversations yet"').count() === 0;
      if (hasConversations) {
        console.log('✅ Conversation created!\n');
      } else {
        console.log('❌ Conversation NOT created - still showing "No conversations yet"\n');
      }
    } else {
      console.log('❌ Start New Chat button not visible\n');
    }

    // Check for input area
    console.log('🔍 Looking for message input...');
    const input = await page.locator('textarea, input[placeholder*="message" i]').first();
    const inputExists = await input.count() > 0;
    
    if (inputExists) {
      console.log('✅ Input found!');
      console.log('📝 Sending test message: "Hello, who are you?"');
      await input.fill('Hello, who are you?');
      
      // Find and click send button
      const sendButton = await page.locator('button[aria-label*="send" i], button:has-text("Send")').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        console.log('✅ Message sent!');
        console.log('⏳ Waiting for response...\n');
        await page.waitForTimeout(30000);
      } else {
        // Try pressing Enter
        await input.press('Enter');
        console.log('✅ Message sent with Enter key!');
        console.log('⏳ Waiting for response...\n');
        await page.waitForTimeout(30000);
      }
    } else {
      console.log('❌ Input NOT found - cannot send message\n');
    }

    console.log('\n✅ Test completed!');
    console.log('🔍 Keeping browser open for 60 seconds...');
    
    // Keep browser open
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

testChat();
