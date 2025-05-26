declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}
export interface YouTubePlayerOptions {
    playerVars?: {
        autoplay?: 0 | 1;
        mute?: 0 | 1;
        controls?: 0 | 1;
        rel?: 0 | 1;
        playsinline?: 0 | 1;
        modestbranding?: 0 | 1;
        fs?: 0 | 1;
        [key: string]: any;
    };
}
export declare class YouTubePlayer {
    private player;
    private readonly containerId;
    private isReady;
    private callbacks;
    private queuedCommands;
    private options;
    constructor(containerId: string, options?: YouTubePlayerOptions);
    private loadYouTubeAPI;
    private initializePlayer;
    private onPlayerReady;
    private onPlayerError;
    private onPlayerStateChange;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    loadVideo(videoId: string, startSeconds?: number): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number | null;
    getVideoData(): {
        video_id: string;
        title: string;
        author: string;
    };
    loadVideoById(params: {
        videoId: string;
        startSeconds?: number;
        suggestedQuality?: string;
    } | string, startSeconds?: number): void;
    setOnReadyCallback(callback: () => void): void;
    setOnErrorCallback(callback: (event: YT.OnErrorEvent) => void): void;
    setOnStateChangeCallback(callback: (event: YT.OnStateChangeEvent) => void): void;
    private queueCommand;
    destroy(): void;
}
//# sourceMappingURL=ytPlayer.d.ts.map