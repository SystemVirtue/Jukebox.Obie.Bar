export class YouTubePlayer {
    constructor(containerId) {
        this.player = null;
        this.isReady = false;
        this.containerId = containerId;
        this.loadYouTubeAPI();
    }
    loadYouTubeAPI() {
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
    initializePlayer() {
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
    onPlayerReady() {
        this.isReady = true;
        if (this.onReadyCallback) {
            this.onReadyCallback();
        }
    }
    onPlayerError(event) {
        console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Player error: ${event.data}`);
    }
    onPlayerStateChange(event) {
        // Handle state changes (playing, paused, ended, etc.)
    }
    stopVideo() {
        if (this.isReady && this.player) {
            this.player.stopVideo();
        }
    }
    loadVideo(videoId) {
        if (this.isReady && this.player) {
            this.player.loadVideoById({
                videoId: videoId,
                suggestedQuality: 'hd720'
            });
        }
    }
    setOnReadyCallback(callback) {
        this.onReadyCallback = callback;
        if (this.isReady) {
            callback();
        }
    }
}
//# sourceMappingURL=ytPlayer.js.map