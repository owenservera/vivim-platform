import React, { useEffect } from 'react';
import { useIOSToast, toast as toastHelper } from './ios';
import { syncEngine } from '../lib/sync/sync-engine';

export const GlobalSocketListener: React.FC = () => {
  const { toast: showToast } = useIOSToast();

  useEffect(() => {
    // Attach the notification handler to the sync engine
    syncEngine.onNotification = (data) => {
      const type = data.type;
      if (type === 'success') {
        showToast(toastHelper.success('Background Activity', data.message));
      } else if (type === 'error') {
        showToast(toastHelper.error('Background Error', data.message));
      } else if (type === 'warning') {
        showToast(toastHelper.warning('Background Warning', data.message));
      } else {
        showToast(toastHelper.info('Background Activity', data.message));
      }
    };

    return () => {
      syncEngine.onNotification = undefined;
    };
  }, [showToast]);

  return null;
};
