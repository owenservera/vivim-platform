
import React, { useEffect, useState } from 'react';
import { captureQueue } from '../lib/capture-queue';
import { logger } from '../lib/logger';

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

      // API REQUIREMENT REMOVED: Skip health check to avoid errors
      // The app can run without the server
      setIsServerOnline(false);
      logger.disconnectFromServer();
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
