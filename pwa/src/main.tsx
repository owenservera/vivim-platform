import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-system.css'
import './index.css'
import App from './App.tsx'

// Service Worker is auto-registered by VitePWA plugin (vite.config.ts).
// Do NOT manually register /service-worker.js here — the file doesn't exist
// as a static asset in dev mode; Vite serves index.html as a fallback which
// causes a SecurityError: "unsupported MIME type (text/html)".

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
