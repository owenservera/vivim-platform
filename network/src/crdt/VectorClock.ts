export class VectorClock {
  private clock: Record<string, number> = {};

  constructor(initial?: Record<string, number>) {
    if (initial) {
      this.clock = { ...initial };
    }
  }

  increment(nodeId: string): VectorClock {
    this.clock[nodeId] = (this.clock[nodeId] || 0) + 1;
    return this;
  }

  merge(other: VectorClock): VectorClock {
    const merged = { ...this.clock };
    for (const [node, time] of Object.entries(other.clock)) {
      merged[node] = Math.max(merged[node] || 0, time);
    }
    this.clock = merged;
    return this;
  }

  get(nodeId: string): number {
    return this.clock[nodeId] || 0;
  }

  toJSON(): Record<string, number> {
    return { ...this.clock };
  }

  compare(other: VectorClock): 'before' | 'after' | 'concurrent' {
    const allNodes = new Set([...Object.keys(this.clock), ...Object.keys(other.clock)]);
    let thisBeforeOther = true;
    let otherBeforeThis = true;

    for (const node of allNodes) {
      const thisTime = this.clock[node] || 0;
      const otherTime = other.clock[node] || 0;

      if (thisTime > otherTime) thisBeforeOther = false;
      if (otherTime > thisTime) otherBeforeThis = false;
    }

    if (thisBeforeOther && !otherBeforeThis) return 'before';
    if (otherBeforeThis && !thisBeforeOther) return 'after';
    return 'concurrent';
  }

  happensBefore(other: VectorClock): boolean {
    let atLeastOneLess = false;
    for (const [node, otherTime] of Object.entries(other.clock)) {
      const thisTime = this.clock[node] || 0;
      if (thisTime > otherTime) return false;
      if (thisTime < otherTime) atLeastOneLess = true;
    }
    return atLeastOneLess;
  }

  isConcurrent(other: VectorClock): boolean {
    return this.compare(other) === 'concurrent';
  }

  static merge(a: VectorClock, b: VectorClock): VectorClock {
    return new VectorClock().merge(a).merge(b);
  }
}
