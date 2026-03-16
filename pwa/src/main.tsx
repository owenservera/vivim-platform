import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.tsx'
import { unifiedDebugService } from './lib/unified-debug-service'
import { errorReporter } from '../../common/error-reporting'

// Polyfills for libp2p and crypto
declare global {
  interface Window {
    Buffer: typeof Buffer;
    global: typeof globalThis;
    process: { env: {} };
    unifiedDebugService: any;
    errorReporter: any;
  }
}

window.Buffer = Buffer;
window.global = window;
window.process = { env: {} };

// Expose debug services to window for E2E testing and debugging
window.unifiedDebugService = unifiedDebugService;
window.errorReporter = errorReporter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
