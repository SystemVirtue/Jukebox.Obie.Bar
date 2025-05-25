import { EventDetail, EventName } from '../types/events.js';

type EventCallback<T extends EventName> = (detail: EventDetail[T]) => void;

interface EventSubscription<T extends EventName> {
    eventName: T;
    callback: EventCallback<T>;
}

export class EventBus {
    private static instance: EventBus;
    private subscribers: Map<EventName, Set<EventCallback<any>>>;

    private constructor() {
        this.subscribers = new Map();
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    public subscribe<T extends EventName>(
        eventName: T,
        callback: EventCallback<T>
    ): EventSubscription<T> {
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, new Set());
        }
        const callbacks = this.subscribers.get(eventName)!;
        callbacks.add(callback as EventCallback<any>);

        return {
            eventName,
            callback
        };
    }

    public unsubscribe<T extends EventName>({ eventName, callback }: EventSubscription<T>): void {
        const callbacks = this.subscribers.get(eventName);
        if (callbacks) {
            callbacks.delete(callback as EventCallback<any>);
            if (callbacks.size === 0) {
                this.subscribers.delete(eventName);
            }
        }
    }

    public emit<T extends EventName>(eventName: T, detail: EventDetail[T]): void {
        const callbacks = this.subscribers.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(detail);
                } catch (error) {
                    console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }
}
