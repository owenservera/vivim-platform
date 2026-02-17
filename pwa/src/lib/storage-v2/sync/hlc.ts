/**
 * Hybrid Logical Clock (HLC)
 * 
 * Provides a strict partial ordering of events across distributed nodes.
 * Combines physical time with a logical counter to handle high-frequency events
 * and clock drift.
 * 
 * Timestamp format: `${physicalTime}:${logicalCounter}:${nodeId}`
 */

export class HLC {
  private static instance: HLC;
  private lastPhysical: number;
  private logical: number;
  private nodeId: string;

  private constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.lastPhysical = 0;
    this.logical = 0;
  }

  public static init(nodeId: string): HLC {
    if (!HLC.instance) {
      HLC.instance = new HLC(nodeId);
    }
    return HLC.instance;
  }

  public static getInstance(): HLC {
    if (!HLC.instance) {
      throw new Error("HLC not initialized. Call init() first.");
    }
    return HLC.instance;
  }

  /**
   * Generate a new HLC timestamp for a local event
   */
  public now(): string {
    const physical = Date.now();

    if (physical > this.lastPhysical) {
      this.lastPhysical = physical;
      this.logical = 0;
    } else {
      // Clock hasn't moved or moved backwards (drift/high frequency)
      this.logical++;
    }

    return this.pack(this.lastPhysical, this.logical, this.nodeId);
  }

  /**
   * Update local clock based on a received remote timestamp
   * Ensures causality: Local time > Remote time
   */
  public update(remoteTimestamp: string): void {
    const { physical: remotePhysical, logical: remoteLogical } = this.unpack(remoteTimestamp);
    const physical = Date.now();

    if (physical > this.lastPhysical && physical > remotePhysical) {
      // Local physical clock is ahead of both
      this.lastPhysical = physical;
      this.logical = 0;
    } else if (remotePhysical > this.lastPhysical && remotePhysical > physical) {
      // Remote clock is ahead
      this.lastPhysical = remotePhysical;
      this.logical = remoteLogical + 1;
    } else if (this.lastPhysical > physical && this.lastPhysical > remotePhysical) {
      // Local logical clock is ahead (e.g., burst of events)
      this.logical++;
    } else {
      // Clocks are roughly equal, take max logical + 1
      if (remotePhysical === this.lastPhysical) {
        this.logical = Math.max(this.logical, remoteLogical) + 1;
      } else {
        this.lastPhysical = Math.max(this.lastPhysical, remotePhysical);
        this.logical++;
      }
    }
  }

  /**
   * Compare two HLC timestamps
   * Returns: -1 if a < b, 1 if a > b, 0 if equal
   */
  public static compare(a: string, b: string): number {
    const parsedA = HLC.parse(a);
    const parsedB = HLC.parse(b);

    if (parsedA.physical !== parsedB.physical) {
      return parsedA.physical - parsedB.physical;
    }
    if (parsedA.logical !== parsedB.logical) {
      return parsedA.logical - parsedB.logical;
    }
    return parsedA.nodeId.localeCompare(parsedB.nodeId);
  }

  private pack(physical: number, logical: number, nodeId: string): string {
    // Pad logical counter to ensure string sort order works for simple cases
    const logicalStr = logical.toString().padStart(5, '0');
    return `${physical}:${logicalStr}:${nodeId}`;
  }

  private unpack(timestamp: string): { physical: number; logical: number; nodeId: string } {
    const [physicalStr, logicalStr, nodeId] = timestamp.split(':');
    return {
      physical: parseInt(physicalStr, 10),
      logical: parseInt(logicalStr, 10),
      nodeId
    };
  }

  private static parse(timestamp: string) {
    const [physicalStr, logicalStr, nodeId] = timestamp.split(':');
    return {
      physical: parseInt(physicalStr, 10),
      logical: parseInt(logicalStr, 10),
      nodeId
    };
  }
}
