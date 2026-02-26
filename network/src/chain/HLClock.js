/**
 * Hybrid Logical Clock (HLC) implementation for VIVIM.
 * Format: "physicalMs:logicalCounter:nodeId"
 */
export class HLClock {
    lastPhysicalMs = 0;
    logicalCounter = 0;
    nodeId;
    constructor(nodeId) {
        this.nodeId = nodeId;
    }
    /**
     * Tick the clock for a new local event.
     */
    tick() {
        const now = Date.now();
        if (now > this.lastPhysicalMs) {
            this.lastPhysicalMs = now;
            this.logicalCounter = 0;
        }
        else {
            this.logicalCounter++;
        }
        return `${this.lastPhysicalMs}:${this.logicalCounter}:${this.nodeId}`;
    }
    /**
     * Update the clock with a timestamp from a remote event.
     */
    receive(remoteTimestamp) {
        const [remoteMsStr, remoteCounterStr] = remoteTimestamp.split(':');
        const remoteMs = parseInt(remoteMsStr, 10);
        const remoteCounter = parseInt(remoteCounterStr, 10);
        const now = Date.now();
        const maxMs = Math.max(this.lastPhysicalMs, remoteMs, now);
        if (maxMs === this.lastPhysicalMs && maxMs === remoteMs) {
            this.logicalCounter = Math.max(this.logicalCounter, remoteCounter) + 1;
        }
        else if (maxMs === this.lastPhysicalMs) {
            this.logicalCounter++;
        }
        else if (maxMs === remoteMs) {
            this.logicalCounter = remoteCounter + 1;
        }
        else {
            this.logicalCounter = 0;
        }
        this.lastPhysicalMs = maxMs;
    }
    /**
     * Compare two HLC timestamps.
     * Returns:
     *  < 0 if a < b
     *  > 0 if a > b
     *  0 if a == b
     */
    static compare(a, b) {
        const [aMs, aCount, aNode] = a.split(':');
        const [bMs, bCount, bNode] = b.split(':');
        const msDiff = parseInt(aMs, 10) - parseInt(bMs, 10);
        if (msDiff !== 0)
            return msDiff;
        const countDiff = parseInt(aCount, 10) - parseInt(bCount, 10);
        if (countDiff !== 0)
            return countDiff;
        if (aNode < bNode)
            return -1;
        if (aNode > bNode)
            return 1;
        return 0;
    }
    /**
     * Get current physical time from clock.
     */
    now() {
        return this.lastPhysicalMs;
    }
}
//# sourceMappingURL=HLClock.js.map