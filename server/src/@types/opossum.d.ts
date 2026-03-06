declare module 'opossum' {
  import { EventEmitter } from 'events';

  interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    maxFailures?: number;
    volumeThreshold?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    enabled?: boolean;
    allowWarmUp?: boolean;
  }

  interface Status {
    failures: number;
    successes: number;
    rejects: number;
    fires: number;
    fallbacks: number;
    timeouts: number;
  }

  class CircuitBreaker extends EventEmitter {
    constructor(action: (...args: any[]) => Promise<any>, options?: CircuitBreakerOptions);
    
    fire(...args: any[]): Promise<any>;
    fallback(action: (...args: any[]) => any): this;
    shutdown(): void;
    open(): void;
    close(): void;
    halfOpen(): void;
    readonly status: Status;
    readonly stats: Status;
  }

  export default CircuitBreaker;
  export { CircuitBreaker, CircuitBreakerOptions, Status };
}
