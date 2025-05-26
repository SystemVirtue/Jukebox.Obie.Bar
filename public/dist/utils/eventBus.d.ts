import { EventDetail, EventName } from '../types/events';
type EventCallback<T extends EventName> = (detail: EventDetail[T]) => void;
interface EventSubscription<T extends EventName> {
    eventName: T;
    callback: EventCallback<T>;
}
export declare class EventBus {
    private static instance;
    private subscribers;
    private constructor();
    static getInstance(): EventBus;
    subscribe<T extends EventName>(eventName: T, callback: EventCallback<T>): EventSubscription<T>;
    unsubscribe<T extends EventName>({ eventName, callback }: EventSubscription<T>): void;
    emit<T extends EventName>(eventName: T, detail: EventDetail[T]): void;
}
export {};
//# sourceMappingURL=eventBus.d.ts.map