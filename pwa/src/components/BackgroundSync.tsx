
import React, { useEffect, useState } from 'react';
import { healthCheck } from '../lib/api';
import { captureQueue } from '../lib/capture-queue';
import { log, logger } from '../lib/logger';

const SYNC_INTERVAL = 20000; // Check every 20 seconds
const MAX_AUTO_RETRIES = 3;

export const BackgroundSync: React.FC = () => {
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [syncingLinks, setSyncingLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkAndSync = async () => {
      const queue = captureQueue.getQueue();
      if (queue.length === 0) {
        // No links, ensure server log disconnected if it was active
        logger.disconnectFromServer();
        return;
      }

      try {
        const status = await healthCheck();
        if (status && status.status === 'ok') {
          setIsServerOnline(true);
          
          // Connect server logs for sync operations
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
          logger.connectToServer(apiBaseUrl);
          
          // Intelligence: background-sync queued links
          for (const item of queue) {
            // Only retry if under max retries and not already syncing this session
            if (item.retryCount < MAX_AUTO_RETRIES && !syncingLinks.has(item.url)) {
               log.api.info('Engine Online: Attempting background materialization', { url: item.url });
               
               // Mark as active
               setSyncingLinks(prev => new Set(prev).add(item.url));

               try {
                  // Attempt silent capture
                  const { captureUrlStream } = await import('../lib/api');
                  const conversation = await captureUrlStream(item.url, (p) => {
                    log.api.debug(`Sync Progress [${p.percent}%]: ${p.message}`, { url: item.url });
                  });

                  // Success: Build DAG local
                  const { getStorage } = await import('../lib/storage-v2');
                  const storage = getStorage();
                  await storage.importFromExtraction({
                    title: conversation.title,
                    provider: conversation.provider,
                    sourceUrl: item.url,
                    messages: conversation.messages,
                    metadata: { model: conversation.metadata?.model }
                  });

                  captureQueue.dequeue(item.url);
                  console.log(`✓ Background sync complete: ${conversation.title}`);
               } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Unknown sync error';
                  captureQueue.markRetry(item.url, msg);
                  log.api.warn('Background sync deferred', { url: item.url, error: msg });
               } finally {
                  setSyncingLinks(prev => {
                    const next = new Set(prev);
                    next.delete(item.url);
                    return next;
                  });
               }
            }
          }
          
          // If queue is now empty after processing, disconnect
          if (captureQueue.getQueue().length === 0) {
            logger.disconnectFromServer();
          }
        }
      } catch (e) {
        setIsServerOnline(false);
        // Connection lost, ensure logger disconnected
        logger.disconnectFromServer();
      }
    };

    checkAndSync();
    interval = setInterval(checkAndSync, SYNC_INTERVAL);
    
    return () => {
      clearInterval(interval);
      logger.disconnectFromServer();
    };
  }, [isServerOnline, syncingLinks]);

  return null;
};
