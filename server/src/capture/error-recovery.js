/**
 * Intelligent Error Recovery System
 * 
 * Classifies errors, selects context-aware recovery strategies, and
 * learns from recovery success/failures.
 */

import { logger } from '../lib/logger.js';
import { telemetry } from '../telemetry/telemetry-system.js';

export class ErrorRecoverySystem {
  constructor() {
    this.recoveryHistory = new Map();
  }

  classifyError(error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('timeout') || msg.includes('navigation') || msg.includes('net::ERR')) {
      return 'NETWORK_TIMEOUT';
    }
    if (msg.includes('selector') || msg.includes('not found') || msg.includes('parse')) {
      return 'PARSING_FAILURE';
    }
    if (msg.includes('oom') || msg.includes('memory') || msg.includes('crash')) {
      return 'RESOURCE_EXHAUSTION';
    }
    if (msg.includes('rate limit') || msg.includes('429')) {
      return 'RATE_LIMIT';
    }
    
    return 'UNKNOWN';
  }

  async attemptRecovery(error, context, executeFn) {
    const errorType = this.classifyError(error);
    const retryCount = context.retryCount || 0;
    
    logger.warn({ errorType, retryCount, originalError: error.message }, 'Attempting error recovery');
    telemetry.increment('recovery.attempt', 1, { errorType });

    if (retryCount >= 3) {
      this.escalateError(error, context);
      throw new Error(`Recovery failed after 3 attempts. Original error: ${error.message}`);
    }

    try {
      let result;
      switch (errorType) {
        case 'NETWORK_TIMEOUT':
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 2000;
          await this.sleep(delay);
          // Increase timeout for next attempt
          context.timeout = (context.timeout || 60000) + 30000;
          result = await executeFn({...context, retryCount: retryCount + 1});
          break;
          
        case 'PARSING_FAILURE':
          // Try without rich formatting or wait longer for dynamic content
          context.richFormatting = false;
          context.waitForTimeout = (context.waitForTimeout || 1000) + 2000;
          result = await executeFn({...context, retryCount: retryCount + 1});
          break;
          
        case 'RESOURCE_EXHAUSTION':
          // Wait longer, force a fresh browser context or worker
          await this.sleep(5000);
          context.forceFreshContext = true;
          result = await executeFn({...context, retryCount: retryCount + 1});
          break;
          
        case 'RATE_LIMIT':
          // Long backoff
          await this.sleep(15000 * (retryCount + 1));
          result = await executeFn({...context, retryCount: retryCount + 1});
          break;
          
        default:
          // Basic retry
          await this.sleep(1000);
          result = await executeFn({...context, retryCount: retryCount + 1});
      }
      
      this.recordSuccess(errorType);
      return result;
      
    } catch (recoveryError) {
      this.recordFailure(errorType);
      throw recoveryError;
    }
  }

  escalateError(error, context) {
    telemetry.increment('recovery.escalation', 1, { provider: context.provider });
    logger.error({ 
      error: error.message, 
      context, 
      stack: error.stack 
    }, 'CRITICAL: Error escalated to human review');
    // In a real system, this might send a Slack/PagerDuty alert
  }

  recordSuccess(errorType) {
    telemetry.increment('recovery.success', 1, { errorType });
    const current = this.recoveryHistory.get(errorType) || { successes: 0, failures: 0 };
    current.successes++;
    this.recoveryHistory.set(errorType, current);
  }

  recordFailure(errorType) {
    telemetry.increment('recovery.failure', 1, { errorType });
    const current = this.recoveryHistory.get(errorType) || { successes: 0, failures: 0 };
    current.failures++;
    this.recoveryHistory.set(errorType, current);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const errorRecovery = new ErrorRecoverySystem();
