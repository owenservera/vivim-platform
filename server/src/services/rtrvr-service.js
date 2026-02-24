import { createRtrvrClient } from '@rtrvr-ai/sdk';
import { logger } from '../lib/logger.js';
import { extractConversation } from './extractor.js';
import { saveConversationUnified } from './storage-adapter.js';
import { socketService } from './socket.js';

/**
 * Execute a Rtrvr process
 * The user provides a natural language prompt, and Rtrvr automates the browser.
 */
export async function executeRtrvrAction(prompt, userId) {
  const notifyUser = (type, message) => {
    if (userId && socketService.io) {
      socketService.io.to(`user:${userId}`).emit('server:toast', { type, message });
    }
  };

  try {
    const client = createRtrvrClient({
      apiKey: process.env.RTRVR_API_KEY || 'dummy_key',
      defaultTarget: 'auto', // Use auto so it attempts to use extension if available
    });

    const runPrompt = `${prompt}
- Wait for the page to completely load.
- Identify the target AI chat interface or conversation.
- Create a share link for the conversation.
- Return ONLY a JSON object exactly like this: {"shareUrl": "https://url.to.the.shared.chat"}
- DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS OR EXTRA TEXT. JUST THE JSON OBJECT.
`;

    logger.info({ prompt }, 'Executing Rtrvr action');
    notifyUser('info', 'Rtrvr is identifying and fetching the chat link...');

    const result = await client.run({
      input: runPrompt,
      target: 'auto'
    });

    // We assume Rtrvr returns output containing the URL or just the text of the conversation.
    // Let's attempt to parse the JSON returned.
    let shareUrl = null;
    try {
      // Find JSON pattern in output if there's any wrapper
      const match = result.data?.output?.match(/\{"shareUrl":\s*"([^"]+)"\}/) || result.output?.match(/\{"shareUrl":\s*"([^"]+)"\}/);
      if (match) {
        shareUrl = match[1];
      } else {
        const parsed = JSON.parse(result.data?.output || result.output);
        shareUrl = parsed.shareUrl;
      }
    } catch (e) {
      // If not strict JSON, look for URLs starting with http
      const outputStr = result.data?.output || result.output;
      const urlMatch = outputStr?.match(/https?:\/\/[^\s"]+/);
      if (urlMatch) {
        shareUrl = urlMatch[0];
      }
    }

    if (!shareUrl) {
      throw new Error("Could not extract a share URL from Rtrvr's output");
    }

    logger.info({ shareUrl }, 'Rtrvr extracted URL, running capture process');
    notifyUser('info', 'Link received! Now processing and saving conversation data...');

    // Process it through our normal capture flow
    const conversation = await extractConversation(shareUrl);
    
    // Save it using unified adapter
    const saved = await saveConversationUnified(conversation, null); // Provide client if DID needed
    
    notifyUser('success', `Rtrvr extraction complete! Saved ${conversation.messages?.length || 0} messages.`);

    return {
      success: true,
      url: shareUrl,
      messagesSaved: conversation.messages?.length || 0,
      engine: saved?.engine,
      rtrvrRawOutput: result.data?.output || result.output,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Rtrvr action failed');
    notifyUser('error', `Rtrvr extraction failed: ${error.message}`);
    throw error;
  }
}
