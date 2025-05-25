import { EventBus } from '../src/utils/eventBus';

describe('EventBus', () => {
    let eventBus: EventBus;

    beforeEach(() => {
        // Clear singleton instance before each test
        (EventBus as any).instance = undefined;
        eventBus = EventBus.getInstance();
    });

    test('subscribes and emits events correctly', () => {
        const errorCallback = jest.fn();
        const videoCallback = jest.fn();

        eventBus.subscribe('error', errorCallback);
        eventBus.subscribe('video-selected', videoCallback);

        const errorDetail = { source: 'test', error: 'test error' };
        eventBus.emit('error', errorDetail);

        expect(errorCallback).toHaveBeenCalledWith(errorDetail);
        expect(videoCallback).not.toHaveBeenCalled();
    });

    test('unsubscribes from events correctly', () => {
        const callback = jest.fn();
        const subscription = eventBus.subscribe('error', callback);

        eventBus.emit('error', { source: 'test', error: 'test error' });
        expect(callback).toHaveBeenCalledTimes(1);

        eventBus.unsubscribe(subscription);

        eventBus.emit('error', { source: 'test', error: 'another error' });
        expect(callback).toHaveBeenCalledTimes(1); // Still only called once
    });

    test('handles multiple subscribers for the same event', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        eventBus.subscribe('emergency-stop', callback1);
        eventBus.subscribe('emergency-stop', callback2);

        eventBus.emit('emergency-stop', undefined);

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    test('handles errors in event handlers gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const throwingCallback = () => { throw new Error('Handler error'); };
        const normalCallback = jest.fn();

        eventBus.subscribe('error', throwingCallback);
        eventBus.subscribe('error', normalCallback);

        eventBus.emit('error', { source: 'test', error: 'test error' });

        expect(consoleSpy).toHaveBeenCalled();
        expect(normalCallback).toHaveBeenCalled(); // Second handler still executes

        consoleSpy.mockRestore();
    });

    test('maintains singleton instance', () => {
        const instance1 = EventBus.getInstance();
        const instance2 = EventBus.getInstance();

        expect(instance1).toBe(instance2);
    });
});
