import fs from 'fs';

const html = fs.readFileSync('debug-chatgpt-1772892416081.html', 'utf8');

// Extract streamController.enqueue data
const matches = html.match(/streamController\.enqueue\(\"(.*?)\"\)/g);
if (matches) {
  console.log('Found', matches.length, 'enqueue calls');
  matches.forEach((match, i) => {
    const data = match.match(/streamController\.enqueue\(\"(.*?)\"\)/)[1];
    console.log(`--- Enqueue ${i+1} ---`);
    try {
      const unescaped = JSON.parse('\"' + data + '\"');
      console.log(unescaped.substring(0, 200) + (unescaped.length > 200 ? '...' : ''));
    } catch (e) {
      console.log('Failed to parse:', data.substring(0, 100));
    }
  });
} else {
  console.log('No stream data found');
}
