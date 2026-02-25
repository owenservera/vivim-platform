import { useEffect, useRef } from 'react';
import { dataSyncService } from '../lib/data-sync-service';
import { logger } from '../lib/logger';

export const useBackgroundSync = () => {
  const syncStarted = useRef(false);

  useEffect(() => {
    if (syncStarted.current) return;
    syncStarted.current = true;

    if (!navigator.onLine) {
      logger.info('SYNC', '[Background Sync] Offline, skipping sync.');
      return;
    }

    dataSyncService.syncFullDatabase((progress) => {
      logger.info('SYNC', `[Background Sync] ${progress.phase}: ${progress.message}`);
    }).then(result => {
      if (result.success) {
        logger.info('SYNC', `[Background Sync] Complete: ${result.syncedConversations} conversations synced`);
      }
    }).catch(err => {
      logger.warn('SYNC', `[Background Sync] Failed: ${err}`);
    });
  }, []);
};
