declare namespace YT {
    interface Player {
        loadVideoById(videoId: string | { videoId: string; suggestedQuality: string }): void;
        cueVideoById(videoId: string | { videoId: string; suggestedQuality: string }): void;
        playVideo(): void;
        pauseVideo(): void;
        stopVideo(): void;
        getPlayerState(): PlayerState;
        getCurrentTime(): number;
        getDuration(): number;
        getVideoLoadedFraction(): number;
        setSize(width: number, height: number): void;
        getIframe(): HTMLIFrameElement;
        destroy(): void;
    }

    interface PlayerOptions {
        width?: number | string;
        height?: number | string;
        videoId?: string;
        playerVars?: {
            playsinline?: 0 | 1;
            controls?: 0 | 1;
            autohide?: 0 | 1;
            autoplay?: 0 | 1;
            loop?: 0 | 1;
            modestbranding?: 0 | 1;
            rel?: 0 | 1;
            showinfo?: 0 | 1;
            fs?: 0 | 1;
            cc_load_policy?: 0 | 1;
            iv_load_policy?: 0 | 1;
            start?: number;
            end?: number;
        };
        events?: {
            onReady?: (event: OnReadyEvent) => void;
            onStateChange?: (event: OnStateChangeEvent) => void;
            onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void;
            onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
            onError?: (event: OnErrorEvent) => void;
            onApiChange?: (event: OnApiChangeEvent) => void;
        };
    }

    interface OnReadyEvent {
        target: Player;
    }

    interface OnStateChangeEvent {
        target: Player;
        data: PlayerState;
    }

    interface OnPlaybackQualityChangeEvent {
        target: Player;
        data: string;
    }

    interface OnPlaybackRateChangeEvent {
        target: Player;
        data: number;
    }

    interface OnErrorEvent {
        target: Player;
        data: number;
    }

    interface OnApiChangeEvent {
        target: Player;
    }

    enum PlayerState {
        UNSTARTED = -1,
        ENDED = 0,
        PLAYING = 1,
        PAUSED = 2,
        BUFFERING = 3,
        CUED = 5
    }

    type Quality = 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres';
}
