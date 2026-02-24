const fs = require('fs');
const data = JSON.parse(fs.readFileSync('server-eslint-report.json', 'utf8'));
data.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.severity === 2) {
      console.log(`${file.filePath}:${msg.line}:${msg.column} - ${msg.ruleId} - ${msg.message}`);
    }
  });
});
