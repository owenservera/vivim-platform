import React, { createContext, useContext, useEffect, useState } from 'react';
import { VivimChainClient, DistributedContentClient } from '@vivim/network-engine';
import { getChainClient } from '../lib/chain-client';
import { getContentClient } from '../lib/content-client';
import { logger } from '../lib/logger';

const log = logger.child({ module: 'vivim-context' });

interface VivimContextType {
  chainClient: VivimChainClient | null;
  contentClient: DistributedContentClient | null;
  isReady: boolean;
  error: Error | null;
}

const VivimContext = createContext<VivimContextType>({
  chainClient: null,
  contentClient: null,
  isReady: false,
  error: null,
});

export const VivimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chainClient, setChainClient] = useState<VivimChainClient | null>(null);
  const [contentClient, setContentClient] = useState<DistributedContentClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        log.info('Initializing Vivim Blockchain Services...');
        const chain = await getChainClient();
        const content = await getContentClient();
        
        setChainClient(chain);
        setContentClient(content);
        setIsReady(true);
        log.info('Vivim Blockchain Services ready');
      } catch (err: any) {
        log.error({ err }, 'Failed to initialize Vivim Blockchain Services');
        setError(err);
      }
    }

    init();
  }, []);

  return (
    <VivimContext.Provider value={{ chainClient, contentClient, isReady, error }}>
      {children}
    </VivimContext.Provider>
  );
};

export const useVivim = () => useContext(VivimContext);
