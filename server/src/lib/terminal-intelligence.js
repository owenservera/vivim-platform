/**
 * Enhanced Terminal Intelligence - Pretty Formatting & Insights
 * 
 * Provides:
 * - Beautiful ASCII art banners
 * - Color-coded status indicators
 * - Real-time performance metrics
 * - Intelligent log categorization
 * - Context-aware visibility
 */

import { config } from '../config/index.js';

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Box drawing characters
const boxChars = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  teeRight: '╠',
  teeLeft: '╣',
  teeDown: '╦',
  teeUp: '╩',
  cross: '╬',
};

/**
 * Create a beautiful bordered box with content
 */
export function createBox(title, lines, options = {}) {
  const {
    color = colors.cyan,
    icon = '📦',
    width = 70,
  } = options;

  const horizontalBorder = boxChars.horizontal.repeat(width);
  
  let output = '';
  output += `${color}${boxChars.topLeft}${horizontalBorder}${boxChars.topRight}${colors.reset}\n`;
  output += `${color}${boxChars.vertical} ${title.padEnd(width - 2)} ${boxChars.vertical}${colors.reset}\n`;
  output += `${color}${boxChars.teeRight}${horizontalBorder}${boxChars.teeLeft}${colors.reset}\n`;
  
  for (const line of lines) {
    const paddedLine = typeof line === 'string' ? line.padEnd(width - 2) : line;
    output += `${color}${boxChars.vertical} ${paddedLine} ${boxChars.vertical}${colors.reset}\n`;
  }
  
  output += `${color}${boxChars.bottomLeft}${horizontalBorder}${boxChars.bottomRight}${colors.reset}`;
  
  return output;
}

/**
 * Print a startup banner with system intelligence
 */
export function printStartupBanner(serviceName, details) {
  const timestamp = new Date().toISOString();
  const nodeVersion = process.version;
  const platform = process.platform;
  const pid = process.pid;
  const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  
  console.log('\n');
  console.log(
    createBox(
      `🚀 ${serviceName.toUpperCase()} INITIALIZING`,
      [
        '',
        `${colors.green}✓${colors.reset} Service Name:    ${serviceName}`,
        `${colors.green}✓${colors.reset} Environment:     ${config.nodeEnv}`,
        `${colors.green}✓${colors.reset} Port:            ${config.port}`,
        `${colors.green}✓${colors.reset} Log Level:       ${config.logLevel}`,
        `${colors.green}✓${colors.reset} Log Format:      ${config.logFormat}`,
        '',
        `${colors.blue}⏱${colors.reset} Start Time:      ${timestamp}`,
        `${colors.blue}💻${colors.reset} Platform:        ${platform}`,
        `${colors.blue}📦${colors.reset} Node Version:    ${nodeVersion}`,
        `${colors.blue}🆔${colors.reset} Process ID:      ${pid}`,
        `${colors.blue}🧠${colors.reset} Memory Usage:    ${memoryUsage} MB`,
        '',
      ],
      { color: colors.cyan, icon: '🚀' }
    )
  );
  console.log('\n');
}

/**
 * Print a request/response visualization
 */
export function printRequestVisualization(req, res, duration) {
  const { method, path, ip, id } = req;
  const { statusCode } = res;
  
  // Method color coding
  const methodColors = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.magenta,
  };
  
  const methodColor = methodColors[method] || colors.white;
  
  // Status code color coding
  let statusColor;
  let statusIcon;
  if (statusCode >= 200 && statusCode < 300) {
    statusColor = colors.green;
    statusIcon = '✅';
  } else if (statusCode >= 300 && statusCode < 400) {
    statusColor = colors.blue;
    statusIcon = '🔄';
  } else if (statusCode >= 400 && statusCode < 500) {
    statusColor = colors.yellow;
    statusIcon = '⚠️';
  } else {
    statusColor = colors.red;
    statusIcon = '❌';
  }
  
  console.log('\n');
  console.log(`${colors.dim}┌──────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.bright}📡 INCOMING REQUEST${colors.reset}${' '.repeat(56)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${methodColor}${method.padEnd(10)}${colors.reset} ${colors.white}${path.padEnd(50)}${colors.reset} ${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.gray}ID:${colors.reset} ${id.slice(0, 8)}...${id.slice(-4)}${' '.repeat(48)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.gray}From:${colors.reset} ${ip.padEnd(51)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.gray}Time:${colors.reset} ${new Date().toISOString().padEnd(49)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${statusIcon} ${statusColor}STATUS: ${statusCode}${colors.reset}${' '.repeat(53 - statusCode.toString().length)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.blue}⏱️${colors.reset} ${colors.white}Duration: ${duration}ms${colors.reset}${' '.repeat(44 - duration.toString().length)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}└──────────────────────────────────────────────────────────────────────────────┘${colors.reset}`);
  console.log('\n');
}

/**
 * Print database operation visualization
 */
export function printDatabaseVisualization(operation, table, duration, rowCount) {
  console.log('\n');
  console.log(`${colors.dim}┌──────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.bright}💾 DATABASE OPERATION${colors.reset}${' '.repeat(54)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.cyan}${operation.toUpperCase().padEnd(15)}${colors.reset} ${colors.white}Table: ${table.padEnd(48)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.green}✓${colors.reset} ${colors.white}Rows Affected: ${rowCount}${colors.reset}${' '.repeat(45 - rowCount.toString().length)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.blue}⏱️${colors.reset} ${colors.white}Duration: ${duration}ms${colors.reset}${' '.repeat(44 - duration.toString().length)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}└──────────────────────────────────────────────────────────────────────────────┘${colors.reset}`);
  console.log('\n');
}

/**
 * Print AI/LLM operation visualization
 */
export function printAIVisualization(model, operation, tokens, duration) {
  console.log('\n');
  console.log(`${colors.dim}┌──────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.bright}🤖 AI OPERATION${colors.reset}${' '.repeat(58)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.magenta}Model:${colors.reset} ${model.padEnd(57)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.cyan}Operation:${colors.reset} ${operation.padEnd(55)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.yellow}📊 Tokens:${colors.reset} ${tokens}${colors.reset}${' '.repeat(50 - tokens.toString().length)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.blue}⏱️${colors.reset} ${colors.white}Duration: ${duration}ms${colors.reset}${' '.repeat(44 - duration.toString().length)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}└──────────────────────────────────────────────────────────────────────────────┘${colors.reset}`);
  console.log('\n');
}

/**
 * Print P2P network visualization
 */
export function printP2PVisualization(event, peerId, latency) {
  const eventIcons = {
    'peer:connected': '🤝',
    'peer:disconnected': '👋',
    'message:received': '📨',
    'message:sent': '📤',
    'dht:query': '🔍',
    'content:stored': '💾',
  };
  
  const icon = eventIcons[event] || '📡';
  
  console.log('\n');
  console.log(`${colors.dim}┌──────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.bright}🌐 P2P NETWORK EVENT${colors.reset}${' '.repeat(54)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${icon} ${colors.cyan}${event.padEnd(55)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.gray}Peer:${colors.reset} ${peerId.slice(0, 16)}...${peerId.slice(-8)}${' '.repeat(42 - peerId.length)}${colors.dim}│${colors.reset}`);
  if (latency) {
    console.log(`${colors.dim}│${colors.reset} ${colors.blue}⏱️${colors.reset} ${colors.white}Latency: ${latency}ms${colors.reset}${' '.repeat(44 - latency.toString().length)}${colors.dim}│${colors.reset}`);
  }
  console.log(`${colors.dim}└──────────────────────────────────────────────────────────────────────────────┘${colors.reset}`);
  console.log('\n');
}

/**
 * Print error visualization with stack trace
 */
export function printErrorVisualization(error, context = {}) {
  console.log('\n');
  console.log(`${colors.dim}┌──────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.bright}${colors.red}❌ ERROR OCCURRED${colors.reset}${' '.repeat(56)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.red}🔴${colors.reset} ${colors.white}${error.message.slice(0, 60).padEnd(60)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.gray}Type:${colors.reset} ${error.name.padEnd(59)}${colors.dim}│${colors.reset}`);
  
  if (context.operation) {
    console.log(`${colors.dim}│${colors.reset} ${colors.gray}Operation:${colors.reset} ${context.operation.padEnd(55)}${colors.dim}│${colors.reset}`);
  }
  
  if (context.user) {
    console.log(`${colors.dim}│${colors.reset} ${colors.gray}User:${colors.reset} ${context.user.padEnd(59)}${colors.dim}│${colors.reset}`);
  }
  
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.yellow}⚠️${colors.reset} ${colors.gray}Stack trace available in logs${' '.repeat(35)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}└──────────────────────────────────────────────────────────────────────────────┘${colors.reset}`);
  console.log('\n');
}

/**
 * Print performance metrics dashboard
 */
export function printPerformanceDashboard(metrics) {
  const {
    requestsPerSecond,
    avgResponseTime,
    errorRate,
    activeConnections,
    memoryUsage,
    cpuUsage,
  } = metrics;
  
  console.log('\n');
  console.log(createBox(
    '📊 PERFORMANCE DASHBOARD',
    [
      '',
      `${colors.green}📈${colors.reset} Requests/sec:    ${requestsPerSecond.toFixed(2)}`,
      `${colors.blue}⏱️${colors.reset} Avg Response:    ${avgResponseTime.toFixed(2)}ms`,
      `${colors.red}❌${colors.reset} Error Rate:      ${errorRate.toFixed(2)}%`,
      `${colors.cyan}🔌${colors.reset} Connections:     ${activeConnections}`,
      `${colors.yellow}🧠${colors.reset} Memory:          ${memoryUsage.toFixed(2)} MB`,
      `${colors.magenta}💻${colors.reset} CPU:             ${cpuUsage.toFixed(2)}%`,
      '',
    ],
    { color: colors.blue }
  ));
  console.log('\n');
}

/**
 * Print context system intelligence
 */
export function printContextIntelligence(event, details) {
  const eventIcons = {
    'bundle:compiled': '🧩',
    'bundle:invalidated': '🔄',
    'prediction:made': '🔮',
    'memory:retrieved': '💡',
    'context:assembled': '🎯',
  };
  
  const icon = eventIcons[event] || '🧠';
  
  console.log('\n');
  console.log(`${colors.dim}┌──────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${colors.bright}🧠 CONTEXT INTELLIGENCE${colors.reset}${' '.repeat(50)}${colors.dim}│${colors.reset}`);
  console.log(`${colors.dim}├──────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${colors.dim}│${colors.reset} ${icon} ${colors.magenta}${event.padEnd(55)}${colors.dim}│${colors.reset}`);
  
  for (const [key, value] of Object.entries(details)) {
    const line = `${colors.gray}${key}:${colors.reset} ${String(value).slice(0, 50)}`;
    console.log(`${colors.dim}│${colors.reset} ${line.padEnd(63)}${colors.dim}│${colors.reset}`);
  }
  
  console.log(`${colors.dim}└──────────────────────────────────────────────────────────────────────────────┘${colors.reset}`);
  console.log('\n');
}

/**
 * Intelligent logging wrapper - decides what to show based on context
 */
export function intelligentLog(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    debug: colors.gray,
    info: colors.green,
    warn: colors.yellow,
    error: colors.red,
  };
  
  const levelIcons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  
  const color = levelColors[level] || colors.white;
  const icon = levelIcons[level] || '📝';
  
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${icon}${colors.reset} ${color}${message}${colors.reset}`);
  
  if (context && Object.keys(context).length > 0) {
    for (const [key, value] of Object.entries(context)) {
      console.log(`${colors.dim}  └─ ${key}:${colors.reset} ${value}`);
    }
  }
}

export default {
  createBox,
  printStartupBanner,
  printRequestVisualization,
  printDatabaseVisualization,
  printAIVisualization,
  printP2PVisualization,
  printErrorVisualization,
  printPerformanceDashboard,
  printContextIntelligence,
  intelligentLog,
  colors,
  boxChars,
};
