export declare class VectorClock {
    private clock;
    constructor(initial?: Record<string, number>);
    increment(nodeId: string): VectorClock;
    merge(other: VectorClock): VectorClock;
    get(nodeId: string): number;
    toJSON(): Record<string, number>;
    compare(other: VectorClock): 'before' | 'after' | 'concurrent';
    happensBefore(other: VectorClock): boolean;
    isConcurrent(other: VectorClock): boolean;
    static merge(a: VectorClock, b: VectorClock): VectorClock;
}
//# sourceMappingURL=VectorClock.d.ts.map