const https = require('https');

// Test the deployed Instagram connect endpoint
const testData = JSON.stringify({ userId: 'test_user_deployed' });

const options = {
  hostname: 'dm-closer-ai-hellocrossman.replit.app',
  port: 443,
  path: '/api/instagram/connect',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('Testing deployed Instagram OAuth endpoint...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response status:', res.statusCode);
      console.log('Auth URL:', response.authUrl);
      
      // Extract redirect URI
      const redirectMatch = response.authUrl.match(/redirect_uri=([^&]+)/);
      if (redirectMatch) {
        const redirectUri = decodeURIComponent(redirectMatch[1]);
        console.log('Redirect URI:', redirectUri);
      }
    } catch (error) {
      console.log('Raw response:', data);
      console.log('Parse error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(testData);
req.end();