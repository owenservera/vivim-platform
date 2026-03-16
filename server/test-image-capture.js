console.log('🧪 Starting simplified image capture test...');
import('./src/services/extractor.js').then(async ({ extractConversation }) => {
  try {
    const result = await extractConversation('https://chatgpt.com/share/69ab5da0-f5a8-800e-94dd-0e7f6ce335f0', { 
      timeout: 30000,
      metadataOnly: true 
    });
    console.log('✅ Metadata-only test completed');
    console.log('📸 Images found:', result?.images?.length || 0);
    console.log('📝 Title:', result?.title || 'No title');
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}).catch(e => console.error('❌ Import error:', e.message))
