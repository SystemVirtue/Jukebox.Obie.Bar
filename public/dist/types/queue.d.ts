export interface QueueItem {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: string;
    priority: number;
    addedAt: Date;
}
export declare class PriorityQueue {
    private items;
    enqueue(item: Omit<QueueItem, 'addedAt' | 'id'>): string;
    dequeue(): QueueItem | undefined;
    remove(id: string): boolean;
    moveToTop(id: string): boolean;
    clear(): void;
    getQueue(): QueueItem[];
    getNextItem(): QueueItem | undefined;
    isEmpty(): boolean;
    private getMaxPriority;
}
//# sourceMappingURL=queue.d.ts.map