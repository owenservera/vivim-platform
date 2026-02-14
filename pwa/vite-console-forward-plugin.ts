/**
 * Vite Console Forward Plugin
 * 
 * Forwards browser console logs to the Vite dev server
 */

import type { Plugin } from 'vite';

interface ConsoleForwardOptions {
  enabled?: boolean;
  endpoint?: string;
  levels?: Array<'log' | 'warn' | 'error' | 'info' | 'debug'>;
}

export function consoleForwardPlugin(options: ConsoleForwardOptions = {}): Plugin {
  const {
    enabled = true,
    endpoint = '/api/debug/client-logs',
    levels = ['warn', 'error', 'info'],
  } = options;

  if (!enabled) {
    return {
      name: 'vite-console-forward-plugin',
      apply: 'serve',
    };
  }

  return {
    name: 'vite-console-forward-plugin',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const script = `
<script type="module">
(function() {
  const endpoint = '${endpoint}';
  const levels = ${JSON.stringify(levels)};
  const logQueue = [];
  let flushTimeout = null;

  function flushLogs() {
    if (logQueue.length === 0) return;
    
    const logs = logQueue.splice(0);
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    }).catch(() => {
      // Silently fail - we're already handling console errors
    });
  }

  function queueLog(level, args) {
    if (!levels.includes(level)) return;
    
    const message = args.map(arg => {
      try {
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      } catch {
        return '[Unable to stringify]';
      }
    }).join(' ');

    logQueue.push({
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      stacks: level === 'error' ? args.map(arg => arg?.stack).filter(Boolean) : [],
    });

    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushLogs, 100);
  }

  // Patch console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  levels.forEach(level => {
    if (originalConsole[level]) {
      console[level] = function(...args) {
        originalConsole[level].apply(console, args);
        queueLog(level, args);
      };
    }
  });

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    queueLog('error', [event.error || event.message]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    queueLog('error', [event.reason]);
  });

  // Flush before unload
  window.addEventListener('beforeunload', flushLogs);
})();
</script>`;

        // Insert before closing head tag
        return html.replace('</head>', `${script}</head>`);
      },
    },
  };
}

export default consoleForwardPlugin;
