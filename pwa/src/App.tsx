import { AppRouter } from './router/routes';
import { useBackgroundSync } from './hooks/useBackgroundSync';

function App() {
  useBackgroundSync();
  return <AppRouter />;
}

export default App;
