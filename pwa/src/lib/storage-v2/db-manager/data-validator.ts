import { log } from '../../logger';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface SchemaDefinition {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'date';
  properties?: Record<string, SchemaProperty>;
  items?: SchemaDefinition;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  format?: 'date' | 'date-time' | 'email' | 'uri' | 'uuid';
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  items?: SchemaDefinition;
  properties?: Record<string, SchemaProperty>;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  format?: string;
  default?: unknown;
}

const builtInSchemas: Record<string, SchemaDefinition> = {
  conversation: {
    type: 'object',
    required: ['id', 'title', 'provider', 'sourceUrl', 'createdAt', 'exportedAt', 'messages', 'stats'],
    properties: {
      id: { type: 'string', minLength: 1 },
      title: { type: 'string', minLength: 1, maxLength: 500 },
      provider: { type: 'string', enum: ['chatgpt', 'claude', 'gemini', 'grok', 'qwen', 'deepseek', 'perplexity', 'zai', 'kimi', 'other'] },
      sourceUrl: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      exportedAt: { type: 'string', format: 'date-time' },
      metadata: { type: 'object' },
      messages: { type: 'array' },
      stats: { type: 'object' },
    },
  },
  message: {
    type: 'object',
    required: ['id', 'role', 'content'],
    properties: {
      id: { type: 'string', minLength: 1 },
      role: { type: 'string', enum: ['user', 'assistant', 'system', 'tool'] },
      content: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
      wordCount: { type: 'number' },
      characterCount: { type: 'number' },
      metadata: { type: 'object' },
      attachments: { type: 'array' },
    },
  },
  node: {
    type: 'object',
    required: ['id', 'type', 'author', 'timestamp', 'signature'],
    properties: {
      id: { type: 'string', minLength: 1 },
      type: { type: 'string', enum: ['root', 'message', 'edit', 'fork', 'merge', 'annotation'] },
      author: { type: 'string', minLength: 1 },
      timestamp: { type: 'string', format: 'date-time' },
      signature: { type: 'string' },
      conversationId: { type: 'string' },
      role: { type: 'string', enum: ['user', 'assistant', 'system'] },
      content: { type: 'array' },
      parents: { type: 'array' },
      depth: { type: 'number' },
      metadata: { type: 'object' },
    },
  },
  snapshot: {
    type: 'object',
    required: ['id', 'conversationId', 'name', 'head'],
    properties: {
      id: { type: 'string', minLength: 1 },
      conversationId: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      head: { type: 'string', minLength: 1 },
      createdAt: { type: 'string', format: 'date-time' },
      author: { type: 'string' },
    },
  },
};

export class DataValidator {
  private customSchemas: Map<string, SchemaDefinition> = new Map();

  registerSchema(name: string, schema: SchemaDefinition): void {
    this.customSchemas.set(name, schema);
  }

  validate(data: unknown, schemaName: string): ValidationResult {
    const schema = this.customSchemas.get(schemaName) || builtInSchemas[schemaName];
    
    if (!schema) {
      return {
        valid: false,
        errors: [{ field: '', message: `Unknown schema: ${schemaName}`, code: 'UNKNOWN_SCHEMA' }],
        warnings: [],
      };
    }

    return this.validateAgainstSchema(data, schema, '');
  }

  private validateAgainstSchema(
    data: unknown,
    schema: SchemaDefinition,
    path: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push({
          field: path || 'root',
          message: `Expected object, got ${typeof data}`,
          code: 'INVALID_TYPE',
        });
        return { valid: false, errors, warnings };
      }

      if (schema.required) {
        for (const required of schema.required) {
          if (!(required in data)) {
            errors.push({
              field: path ? `${path}.${required}` : required,
              message: `Missing required field: ${required}`,
              code: 'MISSING_REQUIRED',
            });
          }
        }
      }

      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data) {
            const propPath = path ? `${path}.${key}` : key;
            const propResult = this.validateProperty(data[key], propSchema, propPath);
            errors.push(...propResult.errors);
            warnings.push(...propResult.warnings);
          }
        }
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push({
          field: path || 'root',
          message: `Expected array, got ${typeof data}`,
          code: 'INVALID_TYPE',
        });
      } else if (schema.items) {
        data.forEach((item, index) => {
          const itemPath = `${path}[${index}]`;
          const itemResult = this.validateAgainstSchema(item, schema.items!, itemPath);
          errors.push(...itemResult.errors);
          warnings.push(...itemResult.warnings);
        });
      }
    } else {
      const propResult = this.validateProperty(data, schema as SchemaProperty, path);
      errors.push(...propResult.errors);
      warnings.push(...propResult.warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateProperty(
    value: unknown,
    schema: SchemaProperty,
    path: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (value === undefined || value === null) {
      if (schema.required !== false && schema.type !== 'null') {
        errors.push({
          field: path,
          message: `Field is undefined or null`,
          code: 'NULL_VALUE',
        });
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: path,
            message: `Expected string, got ${typeof value}`,
            code: 'INVALID_TYPE',
          });
        } else {
          if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
              field: path,
              message: `String too short: min ${schema.minLength}, got ${value.length}`,
              code: 'MIN_LENGTH',
            });
          }
          if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
              field: path,
              message: `String too long: max ${schema.maxLength}, got ${value.length}`,
              code: 'MAX_LENGTH',
            });
          }
          if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
              errors.push({
                field: path,
                message: `String does not match pattern: ${schema.pattern}`,
                code: 'PATTERN_MISMATCH',
              });
            }
          }
          if (schema.format) {
            const formatValid = this.validateFormat(value, schema.format);
            if (!formatValid) {
              errors.push({
                field: path,
                message: `Invalid ${schema.format} format`,
                code: 'INVALID_FORMAT',
              });
            }
          }
          if (schema.enum && !schema.enum.includes(value)) {
            errors.push({
              field: path,
              message: `Value not in enum: ${schema.enum.join(', ')}`,
              code: 'ENUM_MISMATCH',
            });
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: path,
            message: `Expected number, got ${typeof value}`,
            code: 'INVALID_TYPE',
          });
        } else {
          if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push({
              field: path,
              message: `Value below minimum: ${schema.minimum}`,
              code: 'BELOW_MINIMUM',
            });
          }
          if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push({
              field: path,
              message: `Value above maximum: ${schema.maximum}`,
              code: 'ABOVE_MAXIMUM',
            });
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: path,
            message: `Expected boolean, got ${typeof value}`,
            code: 'INVALID_TYPE',
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            field: path,
            message: `Expected object, got ${typeof value}`,
            code: 'INVALID_TYPE',
          });
        } else if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in value) {
              const propPath = `${path}.${key}`;
              const propResult = this.validateProperty(
                (value as Record<string, unknown>)[key],
                propSchema,
                propPath
              );
              errors.push(...propResult.errors);
              warnings.push(...propResult.warnings);
            }
          }
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: path,
            message: `Expected array, got ${typeof value}`,
            code: 'INVALID_TYPE',
          });
        } else if (schema.items) {
          value.forEach((item, index) => {
            const itemPath = `${path}[${index}]`;
            const itemResult = this.validateProperty(item, schema.items as SchemaProperty, itemPath);
            errors.push(...itemResult.errors);
            warnings.push(...itemResult.warnings);
          });
        }
        break;
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateFormat(value: string, format: string): boolean {
    switch (format) {
      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      case 'date-time':
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'uri':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      default:
        return true;
    }
  }

  sanitize<T extends Record<string, unknown>>(data: T, schemaName: string): T {
    const schema = this.customSchemas.get(schemaName) || builtInSchemas[schemaName];
    
    if (!schema || schema.type !== 'object') {
      return data;
    }

    return this.sanitizeObject(data, schema);
  }

  private sanitizeObject<T extends Record<string, unknown>>(
    data: T,
    schema: SchemaDefinition
  ): T {
    const result: Record<string, unknown> = {};
    const properties = schema.properties || {};

    for (const [key, value] of Object.entries(data)) {
      const propSchema = properties[key];
      
      if (!propSchema) {
        continue;
      }

      if (value === undefined || value === null) {
        if (propSchema.required) {
          result[key] = propSchema.default ?? null;
        }
        continue;
      }

      result[key] = this.sanitizeValue(value, propSchema);
    }

    return result as T;
  }

  private sanitizeValue(value: unknown, schema: SchemaProperty): unknown {
    switch (schema.type) {
      case 'string':
        return String(value).slice(0, schema.maxLength || Infinity);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? (schema.default ?? 0) : num;
      case 'boolean':
        return Boolean(value);
      case 'object':
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return this.sanitizeObject(value as Record<string, unknown>, {
            type: 'object',
            properties: schema.properties,
          });
        }
        return schema.default ?? {};
      case 'array':
        if (Array.isArray(value)) {
          const itemType = schema.items?.type;
          if (itemType === 'string') {
            return value.map(v => String(v));
          } else if (itemType === 'number') {
            return value.map(v => Number(v));
          }
        }
        return [];
      default:
        return value;
    }
  }

  validateBatch(data: unknown[], schemaName: string): { valid: boolean; results: ValidationResult[] } {
    const results = data.map(item => this.validate(item, schemaName));
    return {
      valid: results.every(r => r.valid),
      results,
    };
  }
}
