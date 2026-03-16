console.log('🔍 DEBUGGING EXTRACTION FLOW...');

import('./src/services/extractor.js').then(async ({ extractConversation }) => {
  try {
    console.log('📍 Calling extractConversation...');
    
    const result = await extractConversation('https://chatgpt.com/share/69ab5da0-f5a8-800e-94dd-0e7f6ce335f0', { 
      timeout: 15000,
      richFormatting: true,
      metadataOnly: true 
    });
    
    console.log('✅ extractConversation completed successfully');
    console.log('📊 Result structure:');
    console.log('- Type:', typeof result);
    console.log('- Keys:', Object.keys(result));
    console.log('- Has messages:', 'messages' in result);
    console.log('- Messages type:', typeof result.messages);
    console.log('- Messages is array:', Array.isArray(result.messages));
    console.log('- Messages length:', result.messages?.length || 0);
    console.log('- Messages value:', JSON.stringify(result.messages, null, 2));
    console.log('- Full result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR IN EXTRACTION FLOW:');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
  }
}).catch(e => {
  console.log('❌ IMPORT ERROR:', e.message);
});
