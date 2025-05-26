// Type definitions for YouTube Iframe API
declare namespace YT {
    interface PlayerEvent {
        target: Player;
        data: any;
    }

    // Define the global YT object
    interface YT {
        Player: typeof Player;
        PlayerState: {
            ENDED: number;
            PLAYING: number;
            PAUSED: number;
            BUFFERING: number;
            CUED: number;
        };
    }

    interface Player {
        new(elementId: string, config: PlayerConfig): Player;
        playVideo(): void;
        pauseVideo(): void;
        stopVideo(): void;
        seekTo(seconds: number, allowSeekAhead: boolean): void;
        loadVideoById(videoId: string | {videoId: string, startSeconds?: number, suggestedQuality?: string}): void;
        cueVideoById(videoId: string | {videoId: string, startSeconds?: number, suggestedQuality?: string}): void;
        getVideoLoadedFraction(): number;
        getPlayerState(): number;
        getCurrentTime(): number;
        getDuration(): number;
        getVideoUrl(): string;
        getVideoEmbedCode(): string;
        getOptions(): string[];
        getOption(module: string, option: string): any;
        setOption(module: string, option: string, value: any): void;
        getVolume(): number;
        setVolume(volume: number): void;
        isMuted(): boolean;
        mute(): void;
        unMute(): void;
        setSize(width: number, height: number): void;
        getIframe(): HTMLIFrameElement;
        destroy(): void;
        getPlaybackRate(): number;
        setPlaybackRate(suggestedRate: number): void;
        getAvailablePlaybackRates(): number[];
        getPlaybackQuality(): string;
        setPlaybackQuality(suggestedQuality: string): void;
        getAvailableQualityLevels(): string[];
        getVideoData(): VideoData;
        getVideoStartBytes(): number;
        getVideoBytesLoaded(): number;
        getVideoBytesTotal(): number;
        addEventListener(event: string, listener: (event: any) => void): void;
        removeEventListener(event: string, listener: (event: any) => void): void;
    }

    interface PlayerConfig {
        width?: string | number;
        height?: string | number;
        videoId?: string;
        playerVars?: PlayerVars;
        events?: {
            onReady?: (event: PlayerEvent) => void;
            onStateChange?: (event: PlayerEvent) => void;
            onPlaybackQualityChange?: (event: PlayerEvent) => void;
            onPlaybackRateChange?: (event: PlayerEvent) => void;
            onError?: (event: PlayerEvent) => void;
            onApiChange?: (event: PlayerEvent) => void;
        };
    }

    interface PlayerVars {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        disablekb?: 0 | 1;
        enablejsapi?: 0 | 1;
        fs?: 0 | 1;
        iv_load_policy?: 1 | 3;
        modestbranding?: 0 | 1;
        playsinline?: 0 | 1;
        rel?: 0 | 1;
        showinfo?: 0 | 1;
        origin?: string;
        [key: string]: any;
    }

    interface VideoData {
        video_id: string;
        author: string;
        title: string;
    }
}

// Declare the global YT variable
declare const YT: YT.YT;
