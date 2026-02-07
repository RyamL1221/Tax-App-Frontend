// Quick test to see what the backend actually returns
const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://127.0.0.1:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.userId) {
      console.log('\nuserId type:', typeof data.userId);
      console.log('userId value:', data.userId);
      console.log('userId length:', data.userId.length);
      console.log('userId trimmed:', data.userId.trim());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
