const io = require('socket.io-client');
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NjM1NzU4OCwianRpIjoiZjE3ZDg2OTQtZjhiZC00YmQ2LWEzZTktMDQ3MzhmYWJiZGIxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjMwYjBmYTU2LWE5YWQtNDVmOC1hYjJjLTA3YjJhYjFlYzEyOSIsIm5iZiI6MTc2NjM1NzU4OCwiY3NyZiI6ImQ3MzU0NjU4LWE5MDctNDY0Mi1iMzE5LTY2MWIzNTBiNjBkZSIsImV4cCI6MTc2NjM2MTE4OH0.EDYZBZkj9Ybht3TDRKKboWagzX5tEXTwt3du30vFr6Y';

console.log('🔌 Connecting to WebSocket...');

const socket = io('http://localhost:5000', {
  query: { token },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  
  // Create a test conversation first
  const postData = JSON.stringify({ 
    title: 'Debug Test Chat', 
    model: 'llama3.2', 
    provider: 'ollama' 
  });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/conversations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': postData.length
    }
  };
  
  console.log('📝 Creating conversation...');
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 201) {
        const conversation = JSON.parse(data);
        console.log('✅ Conversation created:', conversation.id);
        
        // Join conversation
        socket.emit('join_conversation', { conversation_id: conversation.id });
        
        setTimeout(() => {
          console.log('📤 Sending test message: "Hi"...');
          socket.emit('send_message', {
            conversation_id: conversation.id,
            message: 'Hi',
            stream: true
          });
        }, 1000);
      } else {
        console.error('❌ Failed to create conversation:', res.statusCode, data);
        socket.disconnect();
        process.exit(1);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request error:', e);
    socket.disconnect();
    process.exit(1);
  });
  
  req.write(postData);
  req.end();
});

socket.on('connected', (data) => {
  console.log('🔗 Authenticated:', data.message);
});

socket.on('joined_conversation', (data) => {
  console.log('📥 Joined conversation:', data.conversation_id);
});

socket.on('message_received', (data) => {
  console.log('📨 Message acknowledged');
});

socket.on('stream_start', (data) => {
  console.log('🚀 Stream started for conversation:', data.conversation_id);
  console.log('💬 Response:');
});

socket.on('stream_chunk', (data) => {
  process.stdout.write(data.content);
  if (data.done) {
    console.log('\n✅ Stream complete');
  }
});

socket.on('stream_end', (data) => {
  console.log('🏁 Stream ended');
  console.log('📊 Final message saved:', data.message ? 'Yes' : 'No');
  
  setTimeout(() => {
    socket.disconnect();
    console.log('👋 Test complete - disconnecting');
    process.exit(0);
  }, 500);
});

socket.on('error', (data) => {
  console.error('❌ Socket Error:', data);
  socket.disconnect();
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('👋 Disconnected from WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
  process.exit(1);
});

// Global timeout
setTimeout(() => {
  console.log('⏱️ Test timeout (30s) - closing');
  socket.disconnect();
  process.exit(1);
}, 30000);
