export class EventBus {
    constructor() {
        this.subscribers = new Map();
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    subscribe(eventName, callback) {
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, new Set());
        }
        const callbacks = this.subscribers.get(eventName);
        callbacks.add(callback);
        return {
            eventName,
            callback
        };
    }
    unsubscribe({ eventName, callback }) {
        const callbacks = this.subscribers.get(eventName);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscribers.delete(eventName);
            }
        }
    }
    emit(eventName, detail) {
        const callbacks = this.subscribers.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(detail);
                }
                catch (error) {
                    console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }
}
//# sourceMappingURL=eventBus.js.map