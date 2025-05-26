
declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}

interface PlayerCallbacks {
    onReady?: () => void;
    onError?: (event: YT.OnErrorEvent) => void;
    onStateChange?: (event: YT.OnStateChangeEvent) => void;
    onPlaybackQualityChange?: (event: YT.OnPlaybackQualityChangeEvent) => void;
    onPlaybackRateChange?: (event: YT.OnPlaybackRateChangeEvent) => void;
    onApiChange?: (event: YT.OnApiChangeEvent) => void;
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

        if (!document.getElementById('youtube-api')) {
            // Add a protocol check to handle both http and https
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            
            const tag = document.createElement('script');
            tag.id = 'youtube-api';
            tag.src = `${protocol}//www.youtube.com/iframe_api`;
            
            // Log for debugging
            console.log(`Loading YouTube API from ${tag.src} with origin ${window.location.origin}`);
            
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Setup global callback
        window.onYouTubeIframeAPIReady = () => {
            this.initializePlayer();
        };
    }

    private initializePlayer(): void {
        // Merge default player vars with user-provided options
        const defaultPlayerVars: YT.PlayerVars = {
            controls: 1, // Show controls per YouTube TOS
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin, // Fix cross-origin issues
            enablejsapi: 1,
            widget_referrer: window.location.href
        };
        
        const playerVars = this.options.playerVars ? 
            { ...defaultPlayerVars, ...this.options.playerVars } : 
            defaultPlayerVars;
        
        this.player = new YT.Player(this.containerId, {
            height: '100%',
            width: '100%',
            playerVars: playerVars,
            events: {
                onReady: this.onPlayerReady.bind(this),
                onError: this.onPlayerError.bind(this),
                onStateChange: this.onPlayerStateChange.bind(this)
            }
        });
    }

    private onPlayerReady(): void {
        this.isReady = true;
        // Process any queued commands
        this.queuedCommands.forEach(cmd => cmd());
        this.queuedCommands = [];
        
        if (this.callbacks.onReady) {
            this.callbacks.onReady();
        }
    }

    private onPlayerError(event: YT.OnErrorEvent): void {
        console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Player error: ${event.data}`);
        if (this.callbacks.onError) {
            this.callbacks.onError(event);
        }
    }

    private onPlayerStateChange(event: YT.OnStateChangeEvent): void {
        // Log the state change for debugging
        const stateNames = {
            [-1]: 'UNSTARTED',
            0: 'ENDED',
            1: 'PLAYING',
            2: 'PAUSED',
            3: 'BUFFERING',
            5: 'VIDEO_CUED'
        };
        console.log(`Player state changed to: ${stateNames[event.data as keyof typeof stateNames] || event.data}`);
        
        if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(event);
        }
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
    public setOnReadyCallback(callback: () => void): void {
        this.callbacks.onReady = callback;
        if (this.isReady) {
            callback();
        }
    }

    public setOnErrorCallback(callback: (event: YT.OnErrorEvent) => void): void {
        this.callbacks.onError = callback;
    }

    public setOnStateChangeCallback(callback: (event: YT.OnStateChangeEvent) => void): void {
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
