// Test isolated extractChatgptData function
const $ = { load: () => ({ find: () => ({ each: () => {} }) }) };

function extractChatgptData($, url, html, richFormatting = true, capturedImagesParam = []) {
  console.log('[TEST] extractChatgptData called with:', {
    capturedImagesParam: capturedImagesParam,
    isArray: Array.isArray(capturedImagesParam),
    length: capturedImagesParam.length
  });
  
  const imageMap = new Map();
  if (capturedImagesParam && Array.isArray(capturedImagesParam)) {
    capturedImagesParam.forEach(img => {
      console.log('[TEST] Processing image:', img);
      if (img.metadata && img.metadata.originalUrl) {
        imageMap.set(img.metadata.originalUrl, img);
      }
    });
  }
  
  console.log('[TEST] extractChatgptData completed successfully');
  return { title: 'Test', messages: [] };
}

// Test the function
try {
  const result = extractChatgptData(null, 'test-url', 'test-html', true, []);
  console.log('[TEST] Result:', result);
} catch (error) {
  console.log('[TEST] Error:', error.message);
  console.log('[TEST] Stack:', error.stack);
}
