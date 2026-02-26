/**
 * Hybrid Logical Clock (HLC) implementation for VIVIM.
 * Format: "physicalMs:logicalCounter:nodeId"
 */
export declare class HLClock {
    private lastPhysicalMs;
    private logicalCounter;
    private nodeId;
    constructor(nodeId: string);
    /**
     * Tick the clock for a new local event.
     */
    tick(): string;
    /**
     * Update the clock with a timestamp from a remote event.
     */
    receive(remoteTimestamp: string): void;
    /**
     * Compare two HLC timestamps.
     * Returns:
     *  < 0 if a < b
     *  > 0 if a > b
     *  0 if a == b
     */
    static compare(a: string, b: string): number;
    /**
     * Get current physical time from clock.
     */
    now(): number;
}
//# sourceMappingURL=HLClock.d.ts.map