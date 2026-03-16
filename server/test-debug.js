console.log('🧪 Testing with debug logging...');
import('./src/services/extractor.js').then(async ({ extractConversation }) => {
  try {
    console.log('🔍 Calling extractConversation...');
    const result = await extractConversation('https://chatgpt.com/share/69ab5da0-f5a8-800e-94dd-0e7f6ce335f0', { 
      timeout: 15000,
      richFormatting: true,
      metadataOnly: true 
    });
    console.log('✅ Extraction completed');
    console.log('📸 Images found:', result?.images?.length || 0);
    console.log('📝 Title:', result?.title || 'No title');
    console.log('📝 Messages:', result?.messages?.length || 0);
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('🔍 Stack:', error.stack?.split('\n')[0] || 'No stack available');
  }
}).catch(e => console.error('❌ Import error:', e.message))
