console.log('🧪 Starting DETAILED debug test...');
console.log('📍 Step 1: Importing extractor service...');

import('./src/services/extractor.js').then(async ({ extractConversation }) => {
  try {
    console.log('✅ Step 1: Extractor service imported successfully');
    console.log('📍 Step 2: Calling extractConversation...');
    console.log('🔍 URL: https://chatgpt.com/share/69ab5da0-f5a8-800e-94dd-0e7f6ce335f0');
    console.log('⚙️  Options:', JSON.stringify({ timeout: 15000, richFormatting: true, metadataOnly: true }, null, 2));
    
    const result = await extractConversation('https://chatgpt.com/share/69ab5da0-f5a8-800e-94dd-0e7f6ce335f0', { 
      timeout: 15000,
      richFormatting: true,
      metadataOnly: true 
    });
    
    console.log('✅ Step 2: extractConversation completed');
    console.log('📊 Result type:', typeof result);
    console.log('📊 Result keys:', result ? Object.keys(result) : 'null result');
    console.log('📸 Images found:', result?.images?.length || 0);
    console.log('📝 Title:', result?.title || 'No title');
    console.log('📝 Messages found:', result?.messages?.length || 0);
    console.log('🏷️  Provider:', result?.provider || 'No provider');
    
  } catch (error) {
    console.log('❌ Test failed with detailed error info:');
    console.log('🔍 Error message:', error.message);
    console.log('🔍 Error type:', typeof error);
    console.log('🔍 Error constructor:', error.constructor.name);
    console.log('🔍 Stack trace available:', !!error.stack);
    if (error.stack) {
      console.log('🔍 First 3 stack lines:');
      error.stack.split('\n').slice(0, 3).forEach((line, i) => {
        console.log(`   ${i + 1}. ${line.trim()}`);
      });
    }
  }
}).catch(e => {
  console.log('❌ Import error with detailed info:');
  console.log('🔍 Import error message:', e.message);
  console.log('🔍 Import error type:', typeof e);
  console.log('🔍 Import error constructor:', e.constructor.name);
});
