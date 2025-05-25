// Mock localStorage
const localStorageMock = {
    store: {} as { [key: string]: string },
    getItem(key: string): string | null {
        return this.store[key] || null;
    },
    setItem(key: string, value: string): void {
        this.store[key] = value.toString();
    },
    clear(): void {
        this.store = {};
    },
    removeItem(key: string): void {
        delete this.store[key];
    }
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IndexedDB
const mockIndexedDB = {
    open: jest.fn().mockReturnValue({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null
    }),
    deleteDatabase: jest.fn().mockReturnValue({
        onsuccess: null,
        onerror: null
    })
};
Object.defineProperty(window, 'indexedDB', { value: mockIndexedDB });
Object.defineProperty(window, 'indexedDB', { value: indexedDB });

// Mock YouTubePlayer
class YouTubePlayerMock {
    loadVideoById = jest.fn();
    stopVideo = jest.fn();
}
(window as any).YT = {
    Player: YouTubePlayerMock
};

// Mock Cache API
const cacheMock = {
    open: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    match: jest.fn()
};
const cachesMock = {
    open: jest.fn(() => Promise.resolve(cacheMock)),
    keys: jest.fn(() => Promise.resolve([])),
    delete: jest.fn(() => Promise.resolve(true))
};
Object.defineProperty(window, 'caches', { value: cachesMock });
