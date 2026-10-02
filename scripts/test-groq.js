// Test Groq API connectivity — loads .env via dotenv
require('dotenv').config({ path: './.env' });

const key = process.env.GROQ_API_KEY;
console.log('Key present:', !!key);
console.log('Key starts with gsk_:', key && key.startsWith('gsk_'));
console.log('Key length:', key && key.length);

const Groq = require('groq-sdk');
const g = new Groq({ apiKey: key });

g.chat.completions.create({
  model: 'llama-3.1-8b-instant',
  messages: [{ role: 'user', content: 'Reply with just: OK' }],
  max_tokens: 10,
  response_format: { type: 'json_object' }
}).then(function(r) {
  console.log('\n✅ Groq API works!');
  console.log('Response:', r.choices[0].message.content);
  console.log('Model:', r.model);
}).catch(function(e) {
  console.error('\n❌ Groq API error:');
  console.error('Status:', e.status);
  console.error('Message:', e.message);
  if (e.status === 401) console.error('→ Invalid API key');
  if (e.status === 429) console.error('→ Rate limited');
  if (e.status === 400) console.error('→ Bad request');
});
