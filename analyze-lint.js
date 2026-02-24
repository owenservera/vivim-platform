const fs = require('fs');

function analyze(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const ruleCounts = {};
  let totalErrors = 0;
  
  data.forEach(file => {
    file.messages.forEach(msg => {
      if (msg.severity === 2) { // 2 means error
        ruleCounts[msg.ruleId] = (ruleCounts[msg.ruleId] || 0) + 1;
        totalErrors++;
      }
    });
  });

  const sorted = Object.entries(ruleCounts).sort((a,b) => b[1] - a[1]);
  console.log(`Total Errors: ${totalErrors}`);
  sorted.forEach(([rule, count]) => {
    console.log(`${rule}: ${count}`);
  });
}

const args = process.argv.slice(2);
if (args.length > 0) {
  analyze(args[0]);
}
