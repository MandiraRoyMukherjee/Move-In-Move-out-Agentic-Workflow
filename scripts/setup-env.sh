#!/bin/bash
source ~/.nvm/nvm.sh
nvm use 20 > /dev/null
node - << 'JSEOF'
const fs = require('fs');
const content = 'DATABASE_URL="file:./prisma/dev.db"\nGROQ_API_KEY="gsk_placeholder"\n';
fs.writeFileSync('/home/mandira/Move-in-Agentic-Workflow/.env', content);
console.log('done');
JSEOF
cat /home/mandira/Move-in-Agentic-Workflow/.env
