/**
 * Hybrid Logical Clock (HLC)
 *
 * Generates globally unique, monotonic timestamps for distributed systems.
 * Format: "2024-01-15T10:30:00.000Z-0001-deviceId123"
 */

export class HLC {
  constructor(wallMs, counter, nodeId) {
    this.wallMs = wallMs;
    this.counter = counter;
    this.nodeId = nodeId;
  }

  static now(nodeId) {
    return new HLC(Date.now(), 0, nodeId);
  }

  static parse(timestamp) {
    if (!timestamp) {
      return null;
    }

    // Format: ISO-COUNTER-NODEID
    // 2024-01-15T10:30:00.000Z-0001-node123

    // Use regex to robustly parse format regardless of hyphens in nodeId
    // Anchors on the 'Z' from toISOString() and the 4-digit counter
    const match = timestamp.match(/^(.+Z)-(\d{4})-(.+)$/);

    if (!match) {
      throw new Error(`Invalid HLC format: ${timestamp}`);
    }

    const [, wallTimeStr, counterStr, nodeId] = match;

    return new HLC(new Date(wallTimeStr).getTime(), parseInt(counterStr, 10), nodeId);
  }

  toString() {
    const date = new Date(this.wallMs).toISOString();
    const counter = this.counter.toString().padStart(4, '0');
    return `${date}-${counter}-${this.nodeId}`;
  }

  /**
   * Update clock on local event
   */
  tick() {
    const now = Date.now();

    if (now > this.wallMs) {
      this.wallMs = now;
      this.counter = 0;
    } else {
      this.counter++;
    }

    return this;
  }

  /**
   * Update clock on receiving remote message
   */
  receive(remoteTimestamp) {
    const remote = HLC.parse(remoteTimestamp);
    const now = Date.now();

    if (now > this.wallMs && now > remote.wallMs) {
      this.wallMs = now;
      this.counter = 0;
    } else if (this.wallMs === remote.wallMs) {
      this.counter = Math.max(this.counter, remote.counter) + 1;
    } else if (remote.wallMs > this.wallMs) {
      this.wallMs = remote.wallMs;
      this.counter = remote.counter + 1;
    } else {
      this.counter++;
    }

    return this;
  }

  clone() {
    return new HLC(this.wallMs, this.counter, this.nodeId);
  }
}
