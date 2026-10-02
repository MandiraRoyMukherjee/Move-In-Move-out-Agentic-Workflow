require('dotenv').config({ path: './.env' });
const Groq = require('groq-sdk');
const g = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Test 1: JSON mode with more tokens
g.chat.completions.create({
  model: 'openai/gpt-oss-20b',
  messages: [
    { role: 'system', content: 'Respond only with valid JSON. No other text.' },
    { role: 'user', content: 'Extract: "I want to move on 15 Dec at 10am". Return {"moveDate":"YYYY-MM-DD","moveTime":"HH:MM"}' }
  ],
  max_tokens: 200,
  response_format: { type: 'json_object' }
}).then(function(r) {
  console.log('✅ JSON mode (200 tokens):', r.choices[0].message.content);
}).catch(function(e) {
  console.log('❌ JSON mode failed:', e.message.slice(0,100));

  // Test 2: Without response_format, extract JSON from text
  return g.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: 'Respond only with valid JSON. No markdown. No explanation.' },
      { role: 'user', content: 'Return: {"moveDate":"2026-12-15","moveTime":"10:00"}' }
    ],
    max_tokens: 200
  });
}).then(function(r) {
  if (r) {
    console.log('✅ Without response_format:', r.choices[0].message.content);
    try {
      var match = r.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (match) console.log('✅ JSON extracted:', JSON.parse(match[0]));
    } catch(e2) { console.log('Parse failed'); }
  }
}).catch(function(e) {
  console.log('❌ Also failed:', e.message);
});
