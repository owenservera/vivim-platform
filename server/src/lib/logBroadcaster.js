/**
 * Server-Side Log Broadcaster
 *
 * Captures all server console output and broadcasts it to connected SSE clients
 * Enables real-time server log streaming to the PWA Debug Panel
 */

class LogBroadcaster {
  constructor() {
    this.clients = new Set();
    this.logBuffer = [];
    this.maxBufferSize = 1000;
    this.initialBufferLimit = 100; // Limit initial send to last 100 logs
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };
    this.initialized = false;
  }

  /**
   * Initialize log capturing by intercepting console methods
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    const self = this;

    // Intercept console.log
    console.log = function (...args) {
      self.originalConsole.log(...args);
      self.broadcast('log', args);
    };

    // Intercept console.error
    console.error = function (...args) {
      self.originalConsole.error(...args);
      self.broadcast('error', args);
    };

    // Intercept console.warn
    console.warn = function (...args) {
      self.originalConsole.warn(...args);
      self.broadcast('warn', args);
    };

    // Intercept console.info
    console.info = function (...args) {
      self.originalConsole.info(...args);
      self.broadcast('info', args);
    };

    // Intercept console.debug
    console.debug = function (...args) {
      self.originalConsole.debug(...args);
      self.broadcast('debug', args);
    };

    this.initialized = true;
    this.log('info', ['LogBroadcaster', 'Server log broadcasting initialized']);
  }

  /**
   * Format log arguments to string
   */
  formatArgs(args) {
    return args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
        }
        if (arg === null) {
          return 'null';
        }
        if (arg === undefined) {
          return 'undefined';
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Broadcast a log message to all connected clients
   */
  broadcast(level, args) {
    const message = this.formatArgs(args);
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message,
      source: 'server',
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Send to all connected clients (with error handling)
    const deadClients = new Set();
    const data = JSON.stringify(logEntry);

    this.clients.forEach((client) => {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch (err) {
        // Mark for removal
        deadClients.add(client);
      }
    });

    // Clean up dead clients
    deadClients.forEach((client) => {
      this.clients.delete(client);
      this.log('warn', ['LogBroadcaster', `Removed dead client (${this.clients.size} remaining)`]);
    });
  }

  /**
   * Manual log method for structured logging
   */
  log(level, args) {
    this.broadcast(level, args);
  }

  /**
   * Send buffered logs in batches to prevent overwhelming the client
   */
  async sendBufferedLogs(res, logsToSend) {
    const batchSize = 20; // Send 20 logs at a time
    const delayMs = 50; // 50ms delay between batches

    for (let i = 0; i < logsToSend.length; i += batchSize) {
      const batch = logsToSend.slice(i, i + batchSize);

      for (const logEntry of batch) {
        try {
          res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
        } catch (err) {
          // Client disconnected during buffer send
          return false;
        }
      }

      // Add delay between batches (except for last batch)
      if (i + batchSize < logsToSend.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return true;
  }

  /**
   * Add a new SSE client
   */
  addClient(req, res) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
    });

    const client = { req, res, id: Date.now() + Math.random() };
    this.clients.add(client);

    // Send only the last N logs (not the entire buffer)
    const recentLogs = this.logBuffer.slice(-this.initialBufferLimit);

    // Send buffered logs in batches
    this.sendBufferedLogs(res, recentLogs)
      .then((success) => {
        if (!success) {
          this.clients.delete(client);
          return;
        }

        // Send connection message
        const connectMsg = {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `🔗 Connected to server log stream (${recentLogs.length} historical logs loaded)`,
          source: 'server',
        };

        try {
          res.write(`data: ${JSON.stringify(connectMsg)}\n\n`);
        } catch (err) {
          this.clients.delete(client);
          return;
        }

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            res.write(': heartbeat\n\n');
          } catch (err) {
            clearInterval(heartbeat);
            this.clients.delete(client);
          }
        }, 30000);

        // Clean up on client disconnect
        req.on('close', () => {
          clearInterval(heartbeat);
          this.clients.delete(client);
          this.log('info', ['LogBroadcaster', `Client disconnected (${this.clients.size} active)`]);
        });

        this.log('info', ['LogBroadcaster', `New client connected (${this.clients.size} active)`]);
      })
      .catch((err) => {
        this.log('error', ['LogBroadcaster', `Failed to send buffered logs: ${err.message}`]);
        this.clients.delete(client);
      });

    return client;
  }

  /**
   * Get current client count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Get buffer size
   */
  getBufferSize() {
    return this.logBuffer.length;
  }

  /**
   * Clear log buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * Restore original console methods
   */
  destroy() {
    if (!this.initialized) {
      return;
    }

    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    // Close all client connections
    this.clients.forEach((client) => {
      try {
        client.res.end();
      } catch (err) {
        // Ignore
      }
    });
    this.clients.clear();

    this.initialized = false;
  }
}

// Singleton instance
const logBroadcaster = new LogBroadcaster();

export { logBroadcaster };
