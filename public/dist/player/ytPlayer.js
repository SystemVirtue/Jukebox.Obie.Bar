export class YouTubePlayer {
    constructor(containerId, options = {}) {
        this.player = null;
        this.isReady = false;
        this.callbacks = {};
        this.queuedCommands = [];
        this.containerId = containerId;
        this.options = options;
        this.loadYouTubeAPI();
    }
    loadYouTubeAPI() {
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
    initializePlayer() {
        // Merge default player vars with user-provided options
        const defaultPlayerVars = {
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
    onPlayerReady() {
        this.isReady = true;
        // Process any queued commands
        this.queuedCommands.forEach(cmd => cmd());
        this.queuedCommands = [];
        if (this.callbacks.onReady) {
            this.callbacks.onReady();
        }
    }
    onPlayerError(event) {
        console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Player error: ${event.data}`);
        if (this.callbacks.onError) {
            this.callbacks.onError(event);
        }
    }
    onPlayerStateChange(event) {
        // Log the state change for debugging
        const stateNames = {
            [-1]: 'UNSTARTED',
            0: 'ENDED',
            1: 'PLAYING',
            2: 'PAUSED',
            3: 'BUFFERING',
            5: 'VIDEO_CUED'
        };
        console.log(`Player state changed to: ${stateNames[event.data] || event.data}`);
        if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(event);
        }
    }
    // Player controls
    playVideo() {
        if (this.isReady && this.player) {
            this.player.playVideo();
        }
        else {
            this.queueCommand(() => this.playVideo());
        }
    }
    pauseVideo() {
        if (this.isReady && this.player) {
            this.player.pauseVideo();
        }
        else {
            this.queueCommand(() => this.pauseVideo());
        }
    }
    stopVideo() {
        if (this.isReady && this.player) {
            this.player.stopVideo();
        }
        else {
            this.queueCommand(() => this.stopVideo());
        }
    }
    loadVideo(videoId, startSeconds = 0) {
        if (this.isReady && this.player) {
            this.player.loadVideoById({
                videoId: videoId,
                startSeconds: startSeconds,
                suggestedQuality: 'hd720'
            });
        }
        else {
            this.queueCommand(() => this.loadVideo(videoId, startSeconds));
        }
    }
    seekTo(seconds, allowSeekAhead = true) {
        if (this.isReady && this.player) {
            this.player.seekTo(seconds, allowSeekAhead);
        }
        else {
            this.queueCommand(() => this.seekTo(seconds, allowSeekAhead));
        }
    }
    // Volume controls
    setVolume(volume) {
        if (volume < 0)
            volume = 0;
        if (volume > 100)
            volume = 100;
        if (this.isReady && this.player) {
            this.player.setVolume(volume);
        }
        else {
            this.queueCommand(() => this.setVolume(volume));
        }
    }
    getVolume() {
        if (this.isReady && this.player) {
            return this.player.getVolume();
        }
        return 100; // Default volume
    }
    mute() {
        if (this.isReady && this.player) {
            this.player.mute();
        }
        else {
            this.queueCommand(() => this.mute());
        }
    }
    unMute() {
        if (this.isReady && this.player) {
            this.player.unMute();
        }
        else {
            this.queueCommand(() => this.unMute());
        }
    }
    isMuted() {
        if (this.isReady && this.player) {
            return this.player.isMuted();
        }
        return false;
    }
    // Playback info
    getCurrentTime() {
        if (this.isReady && this.player) {
            return this.player.getCurrentTime();
        }
        return 0;
    }
    getDuration() {
        if (this.isReady && this.player) {
            return this.player.getDuration();
        }
        return 0;
    }
    getPlayerState() {
        if (this.isReady && this.player) {
            return this.player.getPlayerState();
        }
        return null;
    }
    getVideoData() {
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
    loadVideoById(params, startSeconds) {
        if (typeof params === 'string') {
            this.loadVideo(params, startSeconds);
        }
        else {
            this.loadVideo(params.videoId, params.startSeconds);
        }
    }
    // Event callbacks
    setOnReadyCallback(callback) {
        this.callbacks.onReady = callback;
        if (this.isReady) {
            callback();
        }
    }
    setOnErrorCallback(callback) {
        this.callbacks.onError = callback;
    }
    setOnStateChangeCallback(callback) {
        this.callbacks.onStateChange = callback;
    }
    // Helper method to queue commands before player is ready
    queueCommand(command) {
        if (this.isReady) {
            command();
        }
        else {
            this.queuedCommands.push(command);
        }
    }
    destroy() {
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
//# sourceMappingURL=ytPlayer.js.map