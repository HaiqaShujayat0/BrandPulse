require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing Gemini API directly...');
console.log('API Key:', apiKey?.substring(0, 15) + '...');

const postData = JSON.stringify({
    contents: [{
        parts: [{ text: 'Say hello' }]
    }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    console.log('\nStatus Code:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('\nFull Response:');
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.write(postData);
req.end();
