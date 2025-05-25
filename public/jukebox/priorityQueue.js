export class PriorityQueue {
    constructor() {
        this.queue = [];
        this.totalCredits = 0;
    }
    add(videoId, isPaid = false, credits = 1) {
        if (this.totalCredits + credits > PriorityQueue.MAX_CREDITS) {
            throw new Error('CreditOverflow');
        }
        const item = {
            videoId,
            isPaid,
            timestamp: Date.now(),
            credits
        };
        // Insert maintaining sort by isPaid (true first) then timestamp
        const insertIndex = this.queue.findIndex(existing => (!existing.isPaid && item.isPaid) ||
            (existing.isPaid === item.isPaid && existing.timestamp > item.timestamp));
        if (insertIndex === -1) {
            this.queue.push(item);
        }
        else {
            this.queue.splice(insertIndex, 0, item);
        }
        this.totalCredits += credits;
    }
    peek() {
        return this.queue[0];
    }
    pop() {
        const item = this.queue.shift();
        if (item) {
            this.totalCredits -= item.credits;
        }
        return item;
    }
    getLength() {
        return this.queue.length;
    }
    getTotalCredits() {
        return this.totalCredits;
    }
    isEmpty() {
        return this.queue.length === 0;
    }
}
PriorityQueue.MAX_CREDITS = 255;
//# sourceMappingURL=priorityQueue.js.map