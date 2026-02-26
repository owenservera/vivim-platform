import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './styles/design-system.css'
import './index.css'
import App from './App.tsx'
import { unifiedDebugService } from './lib/unified-debug-service'
import { errorReporter } from '../../common/error-reporting'

// Polyfills for libp2p and crypto
// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.global = window;
// @ts-ignore
window.process = { env: {} };

// Expose debug services to window for E2E testing and debugging
// @ts-ignore
window.unifiedDebugService = unifiedDebugService;
// @ts-ignore
window.errorReporter = errorReporter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
