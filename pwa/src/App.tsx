import { useEffect } from 'react';
import { AppRouter } from './router/routes';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { p2pService } from './lib/p2p-service';

import { VivimProvider } from './contexts/VivimContext';

function App() {
  useBackgroundSync();

  return (
    <VivimProvider>
      <AppRouter />
    </VivimProvider>
  );
}

export default App;
