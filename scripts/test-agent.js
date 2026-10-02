require('dotenv').config({ path: './.env' });
const Groq = require('groq-sdk');
const g = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Simulate exactly what the agent orchestrator does
var systemPrompt = `You are an AI assistant helping residents of "Green Valley Apartments" submit move-in requests.
Respond ONLY with this exact JSON structure (no other text):
{
  "intent": "CREATE_MOVE_IN_REQUEST",
  "extractedData": {
    "moveDate": "YYYY-MM-DD or null",
    "moveTime": "HH:MM or null",
    "apartmentNumber": "string or null",
    "movingCompany": "string or null",
    "vehicleDetails": "string or null",
    "reason": "string or null"
  },
  "missingFields": ["array of required field names still missing"],
  "nextQuestion": "Next question to ask the resident, or null if all required fields are collected",
  "message": "A natural, friendly message to show the resident"
}`;

g.chat.completions.create({
  model: 'openai/gpt-oss-20b',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'I want to move in next Monday at 10 AM. My apartment is A-1204.' }
  ],
  temperature: 0.1,
  max_tokens: 1000
}).then(function(r) {
  var text = r.choices[0].message.content;
  console.log('Raw response:\n', text.slice(0, 500));
  try {
    var match = text.match(/\{[\s\S]*\}/);
    if (match) {
      var parsed = JSON.parse(match[0]);
      console.log('\n✅ Parsed JSON:');
      console.log('  intent:', parsed.intent);
      console.log('  moveDate:', parsed.extractedData && parsed.extractedData.moveDate);
      console.log('  moveTime:', parsed.extractedData && parsed.extractedData.moveTime);
      console.log('  missing:', parsed.missingFields);
      console.log('  nextQuestion:', parsed.nextQuestion);
    } else {
      console.log('⚠️  Could not extract JSON from response');
    }
  } catch(e) {
    console.log('❌ JSON parse error:', e.message);
  }
}).catch(function(e) {
  console.error('❌ API error:', e.status, e.message);
});
