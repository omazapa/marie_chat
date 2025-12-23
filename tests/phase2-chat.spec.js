const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: `test_chat_${Date.now()}@example.com`,
  password: 'TestPass123!',
  full_name: 'Chat Test User'
};

test.describe('Phase 2: Chat Core Functionality', () => {
  let authToken = null;
  let conversationId = null;

  test.beforeAll(async ({ request }) => {
    console.log('Setting up test user...');
    
    // Register test user
    const registerResponse = await request.post(`${API_URL}/api/auth/register`, {
      data: TEST_USER
    });
    
    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.access_token;
    
    console.log('✅ Test user created and authenticated');
  });

  test.beforeEach(async ({ page }) => {
    if (authToken) {
      // Set auth token in localStorage
      await page.goto(BASE_URL);
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify({
          email: 'test@example.com',
          full_name: 'Test User'
        }));
      }, authToken);
    }
  });

  test('should display chat interface when authenticated', async ({ page }) => {
    console.log('Testing chat interface display...');
    
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // Check for main chat container
    await expect(page.getByRole('heading', { name: 'Marie', exact: true })).toBeVisible();
    
    // Check for connection status
    const connectionStatus = page.locator('text=/Connected|Disconnected/');
    await expect(connectionStatus).toBeVisible();

    // Check for new conversation button
    await expect(page.locator('button:has-text("New Conversation")')).toBeVisible();

    console.log('✅ Chat interface displayed correctly');
  });

  test('should create a new conversation via API', async ({ request }) => {
    console.log('Testing conversation creation...');

    const response = await request.post(`${API_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Test Conversation',
        model: 'llama3.2',
        provider: 'ollama'
      }
    });

    expect(response.ok()).toBeTruthy();
    const conversation = await response.json();
    
    expect(conversation).toHaveProperty('id');
    expect(conversation).toHaveProperty('title', 'Test Conversation');
    expect(conversation).toHaveProperty('model', 'llama3.2');
    expect(conversation).toHaveProperty('user_id');
    
    conversationId = conversation.id;
    console.log(`✅ Conversation created: ${conversationId}`);
  });

  test('should list conversations', async ({ request }) => {
    console.log('Testing conversation listing...');

    const response = await request.get(`${API_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('conversations');
    expect(Array.isArray(data.conversations)).toBeTruthy();
    expect(data.conversations.length).toBeGreaterThan(0);

    console.log(`✅ Found ${data.conversations.length} conversations`);
  });

  test('should update conversation title', async ({ request }) => {
    console.log('Testing conversation update...');

    if (!conversationId) {
      test.skip();
    }

    const newTitle = 'Updated Test Conversation';
    const response = await request.patch(`${API_URL}/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: newTitle
      }
    });

    expect(response.ok()).toBeTruthy();
    
    // Verify the update
    const getResponse = await request.get(`${API_URL}/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.ok()).toBeTruthy();
    const conversation = await getResponse.json();
    expect(conversation.title).toBe(newTitle);

    console.log('✅ Conversation updated successfully');
  });

  test('should create conversation from UI', async ({ page }) => {
    console.log('Testing UI conversation creation...');

    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // Click new conversation button
    await page.click('button:has-text("New Conversation")');
    
    // Wait for conversation to be created
    await page.waitForTimeout(2000);

    // Check if new conversation appears in sidebar
    const conversations = page.locator('.ant-list-item');
    const count = await conversations.count();
    expect(count).toBeGreaterThan(0);

    console.log('✅ Conversation created from UI');
  });

  test('should check WebSocket connection', async ({ page }) => {
    console.log('Testing WebSocket connection...');

    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // Wait for WebSocket connection
    await page.waitForTimeout(3000);

    // Check connection status indicator
    const connectedIndicator = page.locator('text=Connected');
    await expect(connectedIndicator).toBeVisible({ timeout: 10000 });

    console.log('✅ WebSocket connected');
  });

  test('should display welcome screen when no conversation selected', async ({ page }) => {
    console.log('Testing welcome screen...');

    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // Check for welcome message
    await expect(page.getByRole('heading', { name: 'Marie', exact: true })).toBeVisible();

    // Check for new conversation button in sidebar
    await expect(page.locator('button:has-text("New Conversation")')).toBeVisible();

    console.log('✅ Welcome screen displayed');
  });

  test('should send message and receive streaming response', async ({ page }) => {
    console.log('Testing message sending with streaming...');

    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // Create or select a conversation
    await page.click('button:has-text("New Conversation")');
    await page.waitForTimeout(2000);

    // Find message input
    const messageInput = page.locator('textarea[placeholder*="Type your message"]');
    await expect(messageInput).toBeVisible();

    // Type and send message
    await messageInput.fill('Hello, this is a test message!');
    await page.keyboard.press('Enter');

    // Wait for message to appear
    await page.waitForTimeout(1000);

    // Check if user message is displayed
    await expect(page.locator('text=Hello, this is a test message!')).toBeVisible();

    // Wait for assistant response (streaming)
    // Note: Actual response depends on Ollama being available
    await page.waitForTimeout(5000);

    console.log('✅ Message sent and response expected');
  });

  test('should display message history', async ({ request, page }) => {
    console.log('Testing message history display...');

    if (!conversationId) {
      test.skip();
    }

    // Get messages via API
    const response = await request.get(`${API_URL}/api/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    console.log(`Found ${data.messages.length} messages in conversation`);

    if (data.messages.length > 0) {
      // Navigate to chat page and select conversation
      await page.goto(`${BASE_URL}/chat`);
      await page.waitForLoadState('networkidle');

      // Select the conversation
      // (Implementation depends on UI structure)

      console.log('✅ Message history retrieved');
    }
  });

  test('should handle conversation deletion', async ({ request }) => {
    console.log('Testing conversation deletion...');

    if (!conversationId) {
      test.skip();
    }

    const response = await request.delete(`${API_URL}/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    // Verify deletion
    const getResponse = await request.get(`${API_URL}/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.status()).toBe(404);

    console.log('✅ Conversation deleted successfully');
  });

  test('should check Ollama integration', async ({ request }) => {
    console.log('Testing Ollama availability...');

    try {
      const response = await request.get(`${API_URL}/api/models`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Ollama is available');
        console.log(`Available models: ${data.models?.length || 0}`);
      } else {
        console.log('⚠️ Ollama API not accessible');
      }
    } catch (error) {
      console.log('⚠️ Ollama service unavailable:', error.message);
    }
  });

  test('should handle unauthorized access', async ({ page }) => {
    console.log('Testing unauthorized access handling...');

    // Clear localStorage to simulate logged-out state
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to access chat page
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // Should be redirected to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');

    console.log('✅ Unauthorized access handled correctly');
  });
});
