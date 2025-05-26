// Extend the Window interface to include our custom properties
declare interface Window {
    YOUTUBE_API_KEY: string;
    onYouTubeIframeAPIReady: () => void;
    YT: YT.YT;
}

declare namespace YT {
  interface Player {
    // Core methods
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    
    // Volume controls
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    
    // Playback controls
    getPlayerState(): number;
    getCurrentTime(): number;
    getDuration(): number;
    
    // Video data
    getVideoData(): { video_id: string; title: string; author: string };
    
    // Playback quality
    getPlaybackQuality(): string;
    setPlaybackQuality(suggestedQuality: string): void;
    getAvailableQualityLevels(): string[];
    
    // Event handlers
    addEventListener(event: string, listener: (event: any) => void): void;
    removeEventListener(event: string, listener: (event: any) => void): void;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    iv_load_policy?: 1 | 3;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    modestbranding?: 0 | 1;
    playsinline?: 0 | 1;
    origin?: string;
    widget_referrer?: string;
  }

  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: {
      onReady?: (event: any) => void;
      onStateChange?: (event: any) => void;
      onPlaybackQualityChange?: (event: any) => void;
      onPlaybackRateChange?: (event: any) => void;
      onError?: (event: any) => void;
      onApiChange?: (event: any) => void;
    };
  }

  interface PlayerConstructor {
    new (elementId: string | HTMLElement, options: PlayerOptions): Player;
  }

  interface YT {
    Player: PlayerConstructor;
    PlayerState: {
      UNSTARTED: -1;
      ENDED: 0;
      PLAYING: 1;
      PAUSED: 2;
      BUFFERING: 3;
      CUED: 5;
    };
  }
}

// This makes TypeScript aware of import.meta.env
declare namespace NodeJS {
    interface ProcessEnv {
        VITE_YOUTUBE_API_KEY: string;
    }
}

declare const __VITE_YOUTUBE_API_KEY__: string;
