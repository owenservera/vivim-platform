console.log('🧪 Testing basic extraction without images...');
import('./src/services/extractor.js').then(async ({ extractConversation }) => {
  try {
    const result = await extractConversation('https://chatgpt.com/share/69ab5da0-f5a8-800e-94dd-0e7f6ce335f0', { 
      timeout: 15000,
      metadataOnly: true 
    });
    console.log('✅ Basic test completed');
    console.log('📝 Title:', result?.title || 'No title');
    console.log('📸 Images:', result?.images?.length || 0);
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}).catch(e => console.error('❌ Import error:', e.message))
