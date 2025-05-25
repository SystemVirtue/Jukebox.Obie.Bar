declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}
export declare class YouTubePlayer {
    private player;
    private readonly containerId;
    private isReady;
    private onReadyCallback?;
    constructor(containerId: string);
    private loadYouTubeAPI;
    private initializePlayer;
    private onPlayerReady;
    private onPlayerError;
    private onPlayerStateChange;
    stopVideo(): void;
    loadVideo(videoId: string): void;
    setOnReadyCallback(callback: () => void): void;
}
//# sourceMappingURL=ytPlayer.d.ts.map