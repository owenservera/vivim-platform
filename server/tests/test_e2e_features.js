import { getPrismaClient } from './src/lib/database.js';
import { authenticator } from 'otplib';

const prisma = getPrismaClient();
const API_URL = 'http://localhost:3000/api/v1';

async function main() {
  console.log('--- Starting Integration Tests ---');

  // 1. Create a User directly in the DB
  console.log('\n[1] Creating a test user...');
  const testEmail = 'testmfa@example.com';
  const testDid = `did:key:zTest${Date.now()}`;
  
  let user = await prisma.user.upsert({
    where: { email: testEmail },
    update: { mfaEnabled: false, mfaSecret: null, backupCodes: [] },
    create: {
      email: testEmail,
      did: testDid,
      publicKey: 'mock-public-key',
      trustScore: 100,
    }
  });
  console.log(`User created. ID: ${user.id}`);

  // 2. Generate an API Key for that User directly via API Key Service manually
  // Actually, we'll bypass and just insert an API Key into the DB for testing the HTTP endpoints.
  console.log('\n[2] Generating API key for user...');
  const { apiKeyService } = await import('./src/services/api-key-service.js');
  const { key, apiKey } = await apiKeyService.createApiKey(user.id, 'TestRunnerKey');
  console.log(`Generated Key: ${key}`);

  const headers = {
    'x-api-key': key,
    'Content-Type': 'application/json'
  };

  // 3. Test API Key Endpoint (GET /me/api-keys)
  console.log('\n[3] Testing GET /me/api-keys with generated key...');
  const getKeysRes = await fetch(`${API_URL}/account/me/api-keys`, { headers });
  const getKeysData = await getKeysRes.json();
  if (getKeysRes.ok && getKeysData.success) {
    console.log(`✅ GET /me/api-keys successful. User has ${getKeysData.apiKeys.length} keys.`);
  } else {
    console.error(`❌ GET /me/api-keys failed:`, getKeysData);
  }

  // 4. Test MFA Setup
  console.log('\n[4] Testing POST /me/mfa/setup...');
  const setupRes = await fetch(`${API_URL}/account/me/mfa/setup`, { method: 'POST', headers });
  const setupData = await setupRes.json();
  if (!setupRes.ok || !setupData.success) {
    console.error(`❌ MFA Setup failed:`, setupData);
    return;
  }
  console.log(`✅ MFA Setup successful. Secret: ${setupData.secret}`);

  // 5. Test MFA Enable
  console.log('\n[5] Testing POST /me/mfa/enable...');
  // Generate a valid token using the secret
  const validToken = authenticator.generate(setupData.secret);
  
  const enableRes = await fetch(`${API_URL}/account/me/mfa/enable`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ secret: setupData.secret, token: validToken })
  });
  const enableData = await enableRes.json();
  if (!enableRes.ok || !enableData.success) {
    console.error(`❌ MFA Enable failed:`, enableData);
  } else {
    console.log(`✅ MFA Enable successful. Received backup codes:`, enableData.backupCodes);
  }

  // 6. Test Conversations & Caching
  console.log('\n[6] Testing Conversations & Caching layer...');
  const { createConversation } = await import('./src/repositories/ConversationRepository.js');
  
  const convoData = {
    title: 'Test Conversation Cache',
    provider: 'openai',
    sourceUrl: `test://cache-test-${Date.now()}`,
    ownerId: user.id, // Ensure owner logic
    userId: user.id,
    createdAt: new Date().toISOString(),
    messages: [
      { role: 'user', author: 'user', status: 'completed', createdAt: new Date().toISOString() },
      { role: 'assistant', author: 'ai', status: 'completed', createdAt: new Date().toISOString() }
    ]
  };

  const createdConvo = await createConversation(convoData);
  console.log(`✅ Conversation created with ID: ${createdConvo.id} and ${createdConvo.messages?.length} messages`);

  // Test cached messages response
  console.log(`\nFetching messages for ${createdConvo.id}... (Cache miss expected)`);
  const msgRes1 = await fetch(`${API_URL}/conversations/${createdConvo.id}/messages`, { headers });
  const msgData1 = await msgRes1.json();
  console.log(`First fetch [${msgRes1.status}] returned ${msgData1.data?.length} messages. Body:`, JSON.stringify(msgData1).substring(0, 200));

  console.log(`Fetching messages AGAIN for ${createdConvo.id}... (Cache hit expected)`);
  const msgRes2 = await fetch(`${API_URL}/conversations/${createdConvo.id}/messages`, { headers });
  const msgData2 = await msgRes2.json();
  console.log(`Second fetch [${msgRes2.status}] returned ${msgData2.data?.length} messages. Body:`, JSON.stringify(msgData2).substring(0, 200));
  
  // Cleanup test user
  console.log('\n[7] Cleaning up test data...');
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`✅ User ${user.email} deleted.`);
  
  console.log('\n--- Integration Tests Complete ---');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
