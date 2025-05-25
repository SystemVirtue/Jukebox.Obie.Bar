interface PlaylistItem {
    videoId: string;
    title: string;
    thumbnail: string;
}
export declare class PlaylistManager {
    private static readonly DEFAULT_PLAYLISTS;
    private readonly cacheDuration;
    private playlists;
    private db?;
    constructor();
    private initializeDB;
    loadPlaylist(playlistId: string): Promise<PlaylistItem[]>;
    private getFromCache;
    private saveToCache;
    private fetchFromYouTube;
    getDefaultPlaylists(): string[];
}
export {};
//# sourceMappingURL=playlistManager.d.ts.map