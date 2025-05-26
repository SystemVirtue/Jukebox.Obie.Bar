interface QueueItem {
    videoId: string;
    isPaid: boolean;
    timestamp: number;
    credits: number;
}
export declare class PriorityQueue {
    private static readonly MAX_CREDITS;
    private queue;
    private totalCredits;
    add(videoId: string, isPaid?: boolean, credits?: number): void;
    peek(): QueueItem | undefined;
    pop(): QueueItem | undefined;
    getLength(): number;
    getTotalCredits(): number;
    isEmpty(): boolean;
}
export {};
//# sourceMappingURL=priorityQueue.d.ts.map