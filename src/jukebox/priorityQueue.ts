interface QueueItem {
    videoId: string;
    isPaid: boolean;
    timestamp: number;
    credits: number;
}

export class PriorityQueue {
    private static readonly MAX_CREDITS = 255;
    private queue: QueueItem[] = [];
    private totalCredits: number = 0;

    public add(videoId: string, isPaid: boolean = false, credits: number = 1): void {
        if (this.totalCredits + credits > PriorityQueue.MAX_CREDITS) {
            throw new Error('CreditOverflow');
        }

        const item: QueueItem = {
            videoId,
            isPaid,
            timestamp: Date.now(),
            credits
        };

        // Insert maintaining sort by isPaid (true first) then timestamp
        const insertIndex = this.queue.findIndex(
            existing => (!existing.isPaid && item.isPaid) || 
                       (existing.isPaid === item.isPaid && existing.timestamp > item.timestamp)
        );

        if (insertIndex === -1) {
            this.queue.push(item);
        } else {
            this.queue.splice(insertIndex, 0, item);
        }

        this.totalCredits += credits;
    }

    public peek(): QueueItem | undefined {
        return this.queue[0];
    }

    public pop(): QueueItem | undefined {
        const item = this.queue.shift();
        if (item) {
            this.totalCredits -= item.credits;
        }
        return item;
    }

    public getLength(): number {
        return this.queue.length;
    }

    public getTotalCredits(): number {
        return this.totalCredits;
    }

    public isEmpty(): boolean {
        return this.queue.length === 0;
    }
}
