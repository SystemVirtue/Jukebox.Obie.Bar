declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}

export class YouTubePlayer {
    private player: YT.Player | null = null;
    private readonly containerId: string;
    private isReady: boolean = false;
    private onReadyCallback?: () => void;

    constructor(containerId: string) {
        this.containerId = containerId;
        this.loadYouTubeAPI();
    }

    private loadYouTubeAPI(): void {
        // Only load API if not already loaded
        if (window.YT) {
            this.initializePlayer();
            return;
        }

        if (!document.getElementById('youtube-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Setup global callback
        window.onYouTubeIframeAPIReady = () => {
            this.initializePlayer();
        };
    }

    private initializePlayer(): void {
        this.player = new YT.Player(this.containerId, {
            height: '720',
            width: '1280',
            playerVars: {
                controls: 1, // Show controls per YouTube TOS
                playsinline: 1,
                modestbranding: 1,
                rel: 0
            },
            events: {
                onReady: this.onPlayerReady.bind(this),
                onError: this.onPlayerError.bind(this),
                onStateChange: this.onPlayerStateChange.bind(this)
            }
        });
    }

    private onPlayerReady(): void {
        this.isReady = true;
        if (this.onReadyCallback) {
            this.onReadyCallback();
        }
    }

    private onPlayerError(event: YT.OnErrorEvent): void {
        console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Player error: ${event.data}`);
    }

    private onPlayerStateChange(event: YT.OnStateChangeEvent): void {
        // Handle state changes (playing, paused, ended, etc.)
    }

    public stopVideo(): void {
        if (this.isReady && this.player) {
            this.player.stopVideo();
        }
    }

    public loadVideo(videoId: string): void {
        if (this.isReady && this.player) {
            this.player.loadVideoById({
                videoId: videoId,
                suggestedQuality: 'hd720'
            });
        }
    }

    public setOnReadyCallback(callback: () => void): void {
        this.onReadyCallback = callback;
        if (this.isReady) {
            callback();
        }
    }
}
