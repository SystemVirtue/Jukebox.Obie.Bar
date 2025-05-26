
// Reference our custom YouTube Player type definitions
/// <reference path="../types/youtube-player.d.ts" />

declare global {
    interface Window {
        YT: typeof YT;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface PlayerCallbacks {
    onReady?: (event: YT.PlayerEvent) => void;
    onError?: (event: YT.PlayerEvent) => void;
    onStateChange?: (event: YT.PlayerEvent) => void;
    onPlaybackQualityChange?: (event: YT.PlayerEvent) => void;
    onPlaybackRateChange?: (event: YT.PlayerEvent) => void;
    onApiChange?: (event: YT.PlayerEvent) => void;
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

export class YouTubePlayer {
    private player: YT.Player | null = null;
    private readonly containerId: string;
    private isReady: boolean = false;
    private callbacks: PlayerCallbacks = {};
    private queuedCommands: Array<() => void> = [];
    private options: YouTubePlayerOptions;

    constructor(containerId: string, options: YouTubePlayerOptions = {}) {
        this.containerId = containerId;
        this.options = options;
        this.loadYouTubeAPI();
    }

    private loadYouTubeAPI(): void {
        // Only load API if not already loaded
        if (window.YT) {
            this.initializePlayer();
            return;
        }

        // Load the YouTube IFrame API script
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        
        // Save the current callback if it exists
        const previousOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
        
        // Set up our callback
        window.onYouTubeIframeAPIReady = () => {
            if (previousOnYouTubeIframeAPIReady) {
                previousOnYouTubeIframeAPIReady();
            }
            this.initializePlayer();
        };

        // Insert the script
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            document.head.appendChild(tag);
        }
    }

    private initializePlayer(): void {
        if (typeof window.YT === 'undefined' || !window.YT.Player) {
            console.error('YouTube Player API not loaded');
            // Try to load the API if not available
            this.loadYouTubeAPI();
            return;
        }

        // Merge default player vars with user-provided options
        const defaultPlayerVars: YT.PlayerVars = {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            origin: window.location.origin
        };
        
        const playerVars = this.options.playerVars ? 
            { ...defaultPlayerVars, ...this.options.playerVars } : 
            defaultPlayerVars;
        
        try {
            // Create a container if it doesn't exist
            let container = document.getElementById(this.containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = this.containerId;
                document.body.appendChild(container);
            }

            this.player = new window.YT.Player(this.containerId, {
                height: '100%',
                width: '100%',
                playerVars,
                events: {
                    'onReady': (event: YT.PlayerEvent) => this.onPlayerReady(event),
                    'onError': (event: YT.PlayerEvent) => this.onPlayerError(event),
                    'onStateChange': (event: YT.PlayerEvent) => this.onPlayerStateChange(event)
                }
            });
        } catch (error) {
            console.error('Failed to initialize YouTube player:', error);
            throw new Error('Failed to initialize YouTube player');
        }
    }

    private onPlayerReady(event: YT.PlayerEvent): void {
        this.isReady = true;
        this.callbacks.onReady?.(event);
        // Process any queued commands
        this.queuedCommands.forEach(cmd => cmd());
        this.queuedCommands = [];
    }

    private onPlayerError(event: YT.PlayerEvent): void {
        console.error('YouTube Player Error:', event);
        this.callbacks.onError?.(event);
    }

    private onPlayerStateChange(event: YT.PlayerEvent): void {
        this.callbacks.onStateChange?.(event);
    }

    // Player controls
    public playVideo(): void {
        if (this.isReady && this.player) {
            this.player.playVideo();
        } else {
            this.queueCommand(() => this.playVideo());
        }
    }

    public pauseVideo(): void {
        if (this.isReady && this.player) {
            this.player.pauseVideo();
        } else {
            this.queueCommand(() => this.pauseVideo());
        }
    }

    public stopVideo(): void {
        if (this.isReady && this.player) {
            this.player.stopVideo();
        } else {
            this.queueCommand(() => this.stopVideo());
        }
    }

    public loadVideo(videoId: string, startSeconds: number = 0): void {
        if (this.isReady && this.player) {
            this.player.loadVideoById({
                videoId: videoId,
                startSeconds: startSeconds,
                suggestedQuality: 'hd720'
            });
        } else {
            this.queueCommand(() => this.loadVideo(videoId, startSeconds));
        }
    }

    public seekTo(seconds: number, allowSeekAhead: boolean = true): void {
        if (this.isReady && this.player) {
            this.player.seekTo(seconds, allowSeekAhead);
        } else {
            this.queueCommand(() => this.seekTo(seconds, allowSeekAhead));
        }
    }

    // Volume controls
    public setVolume(volume: number): void {
        if (volume < 0) volume = 0;
        if (volume > 100) volume = 100;
        
        if (this.isReady && this.player) {
            this.player.setVolume(volume);
        } else {
            this.queueCommand(() => this.setVolume(volume));
        }
    }

    public getVolume(): number {
        if (this.isReady && this.player) {
            return this.player.getVolume();
        }
        return 100; // Default volume
    }

    public mute(): void {
        if (this.isReady && this.player) {
            this.player.mute();
        } else {
            this.queueCommand(() => this.mute());
        }
    }

    public unMute(): void {
        if (this.isReady && this.player) {
            this.player.unMute();
        } else {
            this.queueCommand(() => this.unMute());
        }
    }

    public isMuted(): boolean {
        if (this.isReady && this.player) {
            return this.player.isMuted();
        }
        return false;
    }

    // Playback info
    public getCurrentTime(): number {
        if (this.isReady && this.player) {
            return this.player.getCurrentTime();
        }
        return 0;
    }

    public getDuration(): number {
        if (this.isReady && this.player) {
            return this.player.getDuration();
        }
        return 0;
    }

    public getPlayerState(): number | null {
        if (this.isReady && this.player) {
            return this.player.getPlayerState();
        }
        return null;
    }

    public getVideoData(): { video_id: string; title: string; author: string } {
        if (this.isReady && this.player) {
            // The YouTube API returns an object with video_id and title
            const data = this.player.getVideoData ? this.player.getVideoData() : { video_id: '', title: '', author: '' };
            // Ensure author is always a string
            return {
                video_id: data.video_id || '',
                title: data.title || '',
                author: data.author || ''
            };
        }
        return { video_id: '', title: '', author: '' };
    }
    
    // Alias for loadVideoById for backward compatibility
    public loadVideoById(params: { videoId: string; startSeconds?: number; suggestedQuality?: string } | string, startSeconds?: number): void {
        if (typeof params === 'string') {
            this.loadVideo(params, startSeconds);
        } else {
            this.loadVideo(params.videoId, params.startSeconds);
        }
    }

    // Event callbacks
    public setOnReadyCallback(callback: (event: YT.PlayerEvent) => void): void {
        this.callbacks.onReady = callback;
    }

    public setOnErrorCallback(callback: (event: YT.PlayerEvent) => void): void {
        this.callbacks.onError = callback;
    }

    public setOnStateChangeCallback(callback: (event: YT.PlayerEvent) => void): void {
        this.callbacks.onStateChange = callback;
    }

    // Helper method to queue commands before player is ready
    private queueCommand(command: () => void): void {
        if (this.isReady) {
            command();
        } else {
            this.queuedCommands.push(command);
        }
    }
    
    public destroy(): void {
        if (this.player) {
            // Remove the iframe
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '';
            }
            this.player = null;
        }
    }
}
