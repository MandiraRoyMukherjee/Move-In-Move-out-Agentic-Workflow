require('dotenv').config({ path: './.env' });
const Groq = require('groq-sdk');
const g = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Test the models that actually appeared in the models list
const candidates = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'allam-2-7b',
  'meta-llama/llama-prompt-guard-2-86m',
];

function tryNext(i) {
  if (i >= candidates.length) {
    console.log('\nNo working chat model found in listed models.');
    return;
  }
  var model = candidates[i];
  process.stdout.write('Testing ' + model + '... ');
  g.chat.completions.create({
    model: model,
    messages: [{ role: 'user', content: 'Say the word OK' }],
    max_tokens: 10
  }).then(function(r) {
    console.log('✅ WORKS — response:', r.choices[0].message.content.trim());
  }).catch(function(e) {
    var msg = e.error && e.error.error && e.error.error.message || e.message;
    console.log('❌ ' + e.status + ': ' + String(msg).slice(0, 80));
    tryNext(i + 1);
  });
}

tryNext(0);
