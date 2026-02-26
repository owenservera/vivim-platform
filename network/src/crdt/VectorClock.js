export class VectorClock {
    clock = {};
    constructor(initial) {
        if (initial) {
            this.clock = { ...initial };
        }
    }
    increment(nodeId) {
        this.clock[nodeId] = (this.clock[nodeId] || 0) + 1;
        return this;
    }
    merge(other) {
        const merged = { ...this.clock };
        for (const [node, time] of Object.entries(other.clock)) {
            merged[node] = Math.max(merged[node] || 0, time);
        }
        this.clock = merged;
        return this;
    }
    get(nodeId) {
        return this.clock[nodeId] || 0;
    }
    toJSON() {
        return { ...this.clock };
    }
    compare(other) {
        const allNodes = new Set([...Object.keys(this.clock), ...Object.keys(other.clock)]);
        let thisBeforeOther = true;
        let otherBeforeThis = true;
        for (const node of allNodes) {
            const thisTime = this.clock[node] || 0;
            const otherTime = other.clock[node] || 0;
            if (thisTime > otherTime)
                thisBeforeOther = false;
            if (otherTime > thisTime)
                otherBeforeThis = false;
        }
        if (thisBeforeOther && !otherBeforeThis)
            return 'before';
        if (otherBeforeThis && !thisBeforeOther)
            return 'after';
        return 'concurrent';
    }
    happensBefore(other) {
        let atLeastOneLess = false;
        for (const [node, otherTime] of Object.entries(other.clock)) {
            const thisTime = this.clock[node] || 0;
            if (thisTime > otherTime)
                return false;
            if (thisTime < otherTime)
                atLeastOneLess = true;
        }
        return atLeastOneLess;
    }
    isConcurrent(other) {
        return this.compare(other) === 'concurrent';
    }
    static merge(a, b) {
        return new VectorClock().merge(a).merge(b);
    }
}
//# sourceMappingURL=VectorClock.js.map