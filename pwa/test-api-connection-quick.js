/**
 * Quick test to verify PWA can connect to backend API
 * Run this in browser console or Node to verify connectivity
 */

const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'sk-openscroll-dev-key-123456789';

async function testAPIConnection() {
  console.log('🔍 Testing API Connection...\n');
  
  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await fetch(`${API_BASE_URL}/`, {
      headers: { 'X-API-Key': API_KEY }
    });
    if (healthRes.ok) {
      const data = await healthRes.json();
      console.log('   ✅ Server is running:', data.service, 'v' + data.version);
    } else {
      console.log('   ❌ Health check failed:', healthRes.status);
    }
  } catch (e) {
    console.log('   ❌ Cannot connect to server:', e.message);
    return;
  }
  
  // Test 2: Feed endpoint
  console.log('\n2. Testing feed endpoint...');
  try {
    const feedRes = await fetch(`${API_BASE_URL}/api/v1/feed`, {
      headers: { 
        'X-API-Key': API_KEY,
        'x-user-id': 'test-user'
      }
    });
    if (feedRes.ok) {
      const data = await feedRes.json();
      console.log('   ✅ Feed API working');
      console.log('   📊 Items returned:', data.items?.length || 0);
      console.log('   📊 Has more:', data.hasMore);
      console.log('   📊 Total candidates:', data.metadata?.totalCandidates);
    } else {
      console.log('   ❌ Feed API error:', feedRes.status, feedRes.statusText);
      const errorText = await feedRes.text();
      console.log('   Error details:', errorText.substring(0, 200));
    }
  } catch (e) {
    console.log('   ❌ Feed API error:', e.message);
  }
  
  // Test 3: Conversations endpoint
  console.log('\n3. Testing conversations endpoint...');
  try {
    const convRes = await fetch(`${API_BASE_URL}/api/v1/conversations`, {
      headers: { 
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    if (convRes.ok) {
      const data = await convRes.json();
      console.log('   ✅ Conversations API working');
      console.log('   📊 Conversations:', data.conversations?.length || 0);
      console.log('   📊 Total in DB:', data.pagination?.total);
    } else {
      console.log('   ❌ Conversations API error:', convRes.status);
    }
  } catch (e) {
    console.log('   ❌ Conversations API error:', e.message);
  }
  
  // Test 4: ACUs endpoint
  console.log('\n4. Testing ACUs endpoint...');
  try {
    const acuRes = await fetch(`${API_BASE_URL}/api/v1/acus`, {
      headers: { 'X-API-Key': API_KEY }
    });
    if (acuRes.ok) {
      const data = await acuRes.json();
      console.log('   ✅ ACUs API working');
      console.log('   📊 ACUs returned:', data.data?.length || 0);
      console.log('   📊 Total in DB:', data.pagination?.total);
    } else {
      console.log('   ❌ ACUs API error:', acuRes.status);
    }
  } catch (e) {
    console.log('   ❌ ACUs API error:', e.message);
  }
  
  console.log('\n✨ Test complete!');
}

// Run the test
testAPIConnection().catch(console.error);
