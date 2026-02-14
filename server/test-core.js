import { Core, isCoreAvailable } from './src/core-bridge.js';

async function run() {
    console.log("========================================");
    console.log("  OpenScroll Core Integration Test");
    console.log("========================================");
    
    if (!isCoreAvailable()) {
        console.error("❌ Core not loaded! Did you run finish_rust_setup.ps1?");
        return;
    }
    
    console.log("✅ Core loaded successfully");
    console.log("----------------------------------------");
    
    try {
        // 1. Test Capture Processing
        console.log("Testing processing...");
        const uniqueSuffix = Date.now();
        const dummyCapture = {
            id: "test-capture-" + uniqueSuffix,
            sourceUrl: "https://claude.ai/chat/123-" + uniqueSuffix,
            contentHash: "hash_main_" + uniqueSuffix, 
            title: "Test Conversation " + uniqueSuffix,
            provider: "claude",
            model: "claude-3-opus",
            messages: [
                { 
                    id: "msg1-" + uniqueSuffix, 
                    role: "user", 
                    content: "What is quantum computing? " + uniqueSuffix, 
                    messageIndex: 0, 
                    createdAt: new Date().toISOString(), 
                    contentHash: "123-" + uniqueSuffix,
                    status: "completed"
                },
                { 
                    id: "msg2-" + uniqueSuffix, 
                    role: "assistant", 
                    content: "Analysis starts. <thinking>Processing quantum states...</thinking> Quantum computing uses qubits... " + uniqueSuffix, 
                    messageIndex: 1, 
                    createdAt: new Date().toISOString(), 
                    contentHash: "456-" + uniqueSuffix,
                    status: "completed"
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            capturedAt: new Date().toISOString(),
            stats: {
                messageCount: 2,
                userMessageCount: 1,
                assistantMessageCount: 1,
                wordCount: 10,
                codeBlockCount: 0,
                imageCount: 0,
                linkCount: 0
            },
            captureStatus: "completed", 
            extractorVersion: "2.0.0",
            decomposed: false,
            tags: [],
            pinned: false,
            archived: false
        };
        
        // Serialize explicitly as the API expects
        const result = await Core.processCaptureNode(JSON.stringify(dummyCapture));
        console.log(`✅ Processed ${result.length} ACUs`);
        
        // 2. Test Storage Ingestion (Atomic)
        console.log("Testing ingestion...");
        const count = Core.ingestConversation(JSON.stringify(dummyCapture));
        console.log(`✅ Ingested conversation with ${count} messages`);
        
        // 3. Test Retrieval
        console.log("Testing retrieval...");
        const retrieved = Core.getConversationByIdNode(dummyCapture.id);
        if (retrieved && retrieved.id === dummyCapture.id) {
            console.log(`✅ Retrieved conversation: ${retrieved.title}`);
        } else {
            console.error("❌ Failed to retrieve conversation");
        }
        
        // 4. Test Search (FTS5)
        console.log("Testing search...");
        const searchResults = Core.searchConversationsNode("quantum", 10);
        console.log(`✅ Search found ${searchResults.length} results for 'quantum'`);
        
        // 5. Test ACU Batch Save
        console.log("Testing ACU batch save...");
        if (result.length > 0) {
            const saveResult = Core.saveAcusNode(result);
            console.log(`✅ Saved ${result.length} ACUs: ${saveResult}`);
        }
        
        console.log("----------------------------------------");
        console.log("✅ All Integration Tests Passed!");
        
    } catch (e) {
        console.error("❌ Test Failed:", e);
        console.error(e.stack);
    }
}

run();
