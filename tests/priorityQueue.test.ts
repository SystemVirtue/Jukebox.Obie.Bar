import { PriorityQueue } from '../src/jukebox/priorityQueue';

describe('PriorityQueue', () => {
    let queue: PriorityQueue;

    beforeEach(() => {
        queue = new PriorityQueue();
    });

    test('should add and retrieve items in priority order', () => {
        queue.add('video1', false);
        queue.add('video2', true);
        queue.add('video3', false);

        expect(queue.pop()?.videoId).toBe('video2'); // Paid video first
        expect(queue.pop()?.videoId).toBe('video1'); // Then unpaid in FIFO order
        expect(queue.pop()?.videoId).toBe('video3');
    });

    test('should throw error on credit overflow', () => {
        // Add videos until we reach 254 credits
        for (let i = 0; i < 254; i++) {
            queue.add(`video${i}`, false, 1);
        }

        // Adding a 2-credit video should throw
        expect(() => queue.add('overflow', false, 2)).toThrow('CreditOverflow');
    });

    test('should correctly track total credits', () => {
        queue.add('video1', true, 1);
        expect(queue.getTotalCredits()).toBe(1);

        queue.add('video2', true, 3);
        expect(queue.getTotalCredits()).toBe(4);

        queue.pop(); // Remove video1 (1 credit)
        expect(queue.getTotalCredits()).toBe(3);
    });
});
