// apps/server/src/ai/errors.js
// ═══════════════════════════════════════════════════════════════════════════
// AI ERROR HIERARCHY - Comprehensive error types for AI operations
// ═══════════════════════════════════════════════════════════════════════════

export class AIError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'AIError';
    this.details = details;
    this.statusCode = details.statusCode || 500;
    this.provider = details.provider || null;
    this.retryable = details.retryable || false;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      provider: this.provider,
      retryable: this.retryable,
      ...(this.details.code && { code: this.details.code }),
    };
  }
}

export class AuthenticationError extends AIError {
  constructor(message, details = {}) {
    super(message, { ...details, statusCode: 401, retryable: false });
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AIError {
  constructor(message, details = {}) {
    super(message, { ...details, statusCode: 429, retryable: true });
    this.name = 'RateLimitError';
    this.retryAfter = details.retryAfter || 60;
  }
}

export class ProviderUnavailableError extends AIError {
  constructor(message, details = {}) {
    super(message, { ...details, statusCode: 503, retryable: true });
    this.name = 'ProviderUnavailableError';
  }
}

export class ToolExecutionError extends AIError {
  constructor(message, details = {}) {
    super(message, { ...details, statusCode: 500, retryable: false });
    this.name = 'ToolExecutionError';
    this.toolName = details.toolName || null;
  }
}

export class ContextAssemblyError extends AIError {
  constructor(message, details = {}) {
    super(message, { ...details, statusCode: 500, retryable: true });
    this.name = 'ContextAssemblyError';
  }
}

export class InvalidProviderError extends AIError {
  constructor(provider) {
    super(`Invalid or unsupported provider: ${provider}`, {
      statusCode: 400,
      retryable: false,
      provider,
    });
    this.name = 'InvalidProviderError';
  }
}

export class TokenBudgetExceededError extends AIError {
  constructor(message, details = {}) {
    super(message, { ...details, statusCode: 400, retryable: false });
    this.name = 'TokenBudgetExceededError';
    this.budget = details.budget || 0;
    this.actual = details.actual || 0;
  }
}
