export class PlaylistManager {
    constructor() {
        this.cacheDuration = 23 * 60 * 60 * 1000 + 59 * 60 * 1000; // 23h59m in ms
        this.playlists = new Map();
        this.initializeDB();
    }
    async initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('JukeboxCache', 1);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('playlists')) {
                    db.createObjectStore('playlists', { keyPath: 'playlistId' });
                }
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
        });
    }
    async loadPlaylist(playlistId) {
        // First try to get from cache
        const cachedItems = await this.getFromCache(playlistId);
        if (cachedItems) {
            return cachedItems;
        }
        // If not in cache, fetch from YouTube API
        try {
            const items = await this.fetchFromYouTube(playlistId);
            await this.saveToCache(playlistId, items);
            return items;
        }
        catch (error) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Failed to load playlist: ${error}`);
            throw error;
        }
    }
    async getFromCache(playlistId) {
        if (!this.db)
            return null;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.get(playlistId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const data = request.result;
                if (data && (Date.now() - data.timestamp) < this.cacheDuration) {
                    resolve(data.items);
                }
                else {
                    resolve(null);
                }
            };
        });
    }
    async saveToCache(playlistId, items) {
        if (!this.db)
            return;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.put({
                playlistId,
                items,
                timestamp: Date.now()
            });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    getDefaultPlaylists() {
        return [...PlaylistManager.DEFAULT_PLAYLISTS];
    }
    async fetchFromYouTube(playlistId) {
        // Debug: Log available environment variables
        console.log('Environment variables:', {
            'window.YOUTUBE_API_KEY': window.YOUTUBE_API_KEY ? '***' + String(window.YOUTUBE_API_KEY).slice(-4) : 'Not found',
            'import.meta.env.VITE_YOUTUBE_API_KEY': import.meta.env.VITE_YOUTUBE_API_KEY ? '***' + String(import.meta.env.VITE_YOUTUBE_API_KEY).slice(-4) : 'Not found'
        });
        // Get API key from window or import.meta.env
        const apiKey = window.YOUTUBE_API_KEY || import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!apiKey) {
            const errorMsg = 'YouTube API key is not configured. Please check the following:\n' +
                '1. Ensure your .env file exists in the project root\n' +
                '2. It contains VITE_YOUTUBE_API_KEY=your_api_key\n' +
                '3. The server was restarted after updating the .env file\n' +
                'Current environment variables: ' + JSON.stringify({
                'window.YOUTUBE_API_KEY': !!window.YOUTUBE_API_KEY,
                'import.meta.env.VITE_YOUTUBE_API_KEY': !!import.meta.env.VITE_YOUTUBE_API_KEY
            }, null, 2);
            console.error(errorMsg);
            throw new Error('YouTube API key is not configured');
        }
        try {
            // First, get the playlist items
            const playlistItemsUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
            playlistItemsUrl.searchParams.append('part', 'snippet');
            playlistItemsUrl.searchParams.append('maxResults', '50');
            playlistItemsUrl.searchParams.append('playlistId', playlistId);
            playlistItemsUrl.searchParams.append('key', apiKey);
            const response = await fetch(playlistItemsUrl.toString());
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`);
            }
            const data = await response.json();
            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Invalid response from YouTube API');
            }
            // Map the response to our PlaylistItem format
            return data.items
                .filter((item) => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId)
                .map((item) => ({
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || ''
            }));
        }
        catch (error) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Failed to fetch from YouTube: ${error}`);
            throw error;
        }
    }
}
PlaylistManager.DEFAULT_PLAYLISTS = [
    'PLN9QqCogPsXLAtgvLQ0tvpLv820R7PQsM',
    'PLN9QqCogPsXLsv5D5ZswnOSnRIbGU80IS',
    'PLN9QqCogPsXKZsYwYEpHKUhjCJlvVB44h',
    'PLN9QqCogPsXIqfwdfe4hf3qWM1mFweAXP',
    'PLN9QqCogPsXJCgeL_iEgYnW6Rl_8nIUUH'
];
//# sourceMappingURL=playlistManager.js.map