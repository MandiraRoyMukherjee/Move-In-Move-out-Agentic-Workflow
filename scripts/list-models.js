require('dotenv').config({ path: './.env' });
const Groq = require('groq-sdk');
const g = new Groq({ apiKey: process.env.GROQ_API_KEY });

g.models.list().then(function(res) {
  console.log('All available models:');
  res.data
    .sort(function(a, b) { return a.id.localeCompare(b.id); })
    .forEach(function(m) { console.log(' -', m.id); });
}).catch(function(e) {
  console.error('Error:', e.message);
});
