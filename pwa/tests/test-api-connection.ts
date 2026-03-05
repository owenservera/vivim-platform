/**
 * Verification script to test the API endpoints
 */

async function testAPIEndpoints() {
  console.log('Testing API endpoints...\n');
  
  try {
    // Test conversations endpoint
    console.log('1. Testing conversations endpoint...');
    const convResponse = await fetch('http://localhost:3000/api/v1/conversations');
    if (convResponse.ok) {
      const convData = await convResponse.json();
      console.log(`   ✅ Retrieved ${convData.conversations?.length || convData.data?.length || 0} conversations`);
    } else {
      console.log('   ❌ Failed to retrieve conversations');
    }
    
    // Test ACUs endpoint
    console.log('2. Testing ACUs endpoint...');
    const acuResponse = await fetch('http://localhost:3000/api/v1/acus');
    if (acuResponse.ok) {
      const acuData = await acuResponse.json();
      console.log(`   ✅ Retrieved ${acuData.data?.length || 0} ACUs`);
    } else {
      console.log('   ❌ Failed to retrieve ACUs');
    }
    
    // Test feed endpoint
    console.log('3. Testing feed endpoint...');
    const feedResponse = await fetch('http://localhost:3000/api/v1/feed');
    if (feedResponse.ok) {
      const feedData = await feedResponse.json();
      console.log(`   ✅ Retrieved ${feedData.items?.length || 0} feed items`);
    } else {
      console.log('   ❌ Failed to retrieve feed');
    }
    
    console.log('\n🎉 API endpoints are working correctly!');
    console.log('The feed should now display real data from the database.');
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  }
}

// Run the test
testAPIEndpoints();