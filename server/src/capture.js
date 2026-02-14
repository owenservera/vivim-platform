import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Capture a live URL using SingleFile CLI with provider-specific settings
 * @param {string} url - The URL to capture
 * @param {string} provider - The provider identifier (for settings lookup)
 * @param {Object} options - Capture options
 * @returns {Promise<string>} Path to the captured HTML file
 */
async function captureWithSingleFile(url, provider, options = {}) {
  const {
    timeout = 120000,
    tempDir = null,
    singleFileExecutable = null,
    headless = true,
  } = options;

  console.warn(`Capturing URL: ${url}`);
  console.warn(`Provider: ${provider}`);

  // Get provider-specific settings
  const settings = await getProviderSettings(provider);
  if (!settings) {
    throw new Error(`No settings found for provider: ${provider}`);
  }

  // Create temporary file for capture
  const tempDirectory = path.resolve(tempDir || os.tmpdir());
  const tempFileName = `openscroll-${provider}-${uuidv4()}.html`;
  const tempFilePath = path.join(tempDirectory, tempFileName);

  console.warn(`Temporary file: ${tempFilePath}`);

  // Build SingleFile CLI command
  const command = await buildSingleFileCommand(url, tempFilePath, settings, singleFileExecutable, headless);

  console.warn('Executing SingleFile CLI...');

  // Execute SingleFile CLI
  try {
    await executeCommand(command, timeout);
    
    // Verify file was created
    try {
      const stats = await fs.stat(tempFilePath);
      console.warn(`Capture successful: ${tempFilePath} (${stats.size} bytes)`);
      return tempFilePath;
    } catch {
      throw new Error(`SingleFile finished but output file was not created: ${tempFilePath}`);
    }
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Capture failed: ${error.message}`);
  }
}

/**
 * Get provider-specific SingleFile CLI settings
 * @param {string} provider - Provider identifier
 * @returns {Promise<Object|null>} Settings object or null if not found
 */
async function getProviderSettings(provider) {
  // Map provider to settings filename
  const settingsFileMap = {
    'zai': 'zai-settings.txt',
    'chatgpt': 'chatgpt-settings.txt',
    'claude': 'claude-settings.txt',
    'qwen': 'qwen-settings.txt',
    'grok': 'grok-settings.txt',
    'kimi': 'kimi-settings.txt',
    'deepseek': 'deepseek-settings.txt',
    'gemini': 'gemini-settings.txt',
    'perplexity': null, // Not yet implemented
  };

  const settingsFileName = settingsFileMap[provider];
  if (!settingsFileName) {
    return null;
  }

  // Path to settings file (relative to project root)
  const settingsFilePath = path.join(__dirname, '..', 'settings', settingsFileName);

  try {
    const settingsContent = await fs.readFile(settingsFilePath, 'utf8');
    return parseSettingsFile(settingsContent);
  } catch {
    console.warn(`Failed to read settings file: ${settingsFilePath}`);
    return null;
  }
}

/**
 * Parse SingleFile CLI settings file
 * @param {string} content - Settings file content
 * @returns {Object} Parsed settings
 */
function parseSettingsFile(content) {
  const settings = {
    args: [],
  };

  // Parse command line arguments from settings file
  // Format: node single-file-node.js "URL" "OUTPUT" \
  //   --browser-wait-until=networkIdle \
  //   --browser-wait-delay=5000 \
  //   ...

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('node')) {
      continue;
    }
    // Remove trailing backslash and parse arguments
    const cleanLine = trimmed.replace(/\\$/, '').trim();
    if (cleanLine.startsWith('--')) {
      settings.args.push(cleanLine);
    }
  }

  return settings;
}

/**
 * Build the SingleFile CLI command
 * @param {string} url - URL to capture
 * @param {string} outputFile - Output file path
 * @param {Object} settings - Provider settings
 * @param {string|null} customExecutable - Path to custom SingleFile executable
 * @param {boolean} headless - Run browser in headless mode
 * @returns {Promise<Object>} Command object { executable, args }
 */
async function buildSingleFileCommand(url, outputFile, settings, customExecutable = null, headless = true) {
  // Default to single-file-node.js in the parent single-file-cli directory
  const defaultExecutable = path.resolve(__dirname, '..', 'single-file-cli', 'single-file-node.js');
  const executable = customExecutable || defaultExecutable;

  // Check if executable exists
  try {
    await fs.access(executable);
  } catch {
    throw new Error(`SingleFile CLI executable not found: ${executable}`);
  }

  const args = [
    url,
    outputFile,
    ...settings.args,
  ];

  if (!headless) {
    args.push('--browser-headless=false');
  }

  return { executable, args };
}

/**
 * Execute a command as a subprocess
 * @param {Object} command - Command object { executable, args }
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<void>}
 */
function executeCommand(command, timeout) {
  return new Promise((resolve, reject) => {
    const { executable, args } = command;

    console.warn(`Executing: node ${executable} ${args.join(' ')}`);

    // Use 'node' to run the single-file-node.js script
    // Set cwd to the directory of the executable to ensure dependencies resolve correctly
    const childProcess = spawn('node', [executable, ...args], {
      stdio: 'inherit',
      cwd: path.dirname(executable),
    });

    let timeoutHandle;

    // Set timeout
    if (timeout > 0) {
      timeoutHandle = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    }

    childProcess.on('close', (code) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      reject(new Error(`Failed to start command: ${error.message}`));
    });
  });
}

/**
 * Clean up a temporary captured file
 * @param {string} filePath - Path to file to delete
 * @returns {Promise<void>}
 */
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.warn(`Cleaned up temporary file: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to clean up temporary file: ${filePath}`, error?.message);
  }
}

export {
  captureWithSingleFile,
  getProviderSettings,
  cleanupTempFile,
};
