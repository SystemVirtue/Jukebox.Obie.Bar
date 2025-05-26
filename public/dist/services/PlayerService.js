export class PlayerService {
    constructor() {
        this.playerWindow = null;
        this.statusCheckInterval = null;
        this.isPlayerOpen = false;
        this.lastStatus = null;
        this.statusListeners = [];
        this.playerUrl = `${window.location.origin}/player.html`;
        this.setupStorageListener();
    }
    openPlayer() {
        if (this.isPlayerOpen && !this.playerWindow?.closed) {
            this.focusPlayer();
            return;
        }
        // Use screen dimensions for optimal fullscreen experience
        const features = [
            'popup=yes',
            `width=${window.screen.availWidth}`, // Use full screen width
            `height=${window.screen.availHeight}`, // Use full screen height
            'left=0',
            'top=0',
            'scrollbars=no',
            'toolbar=no',
            'location=no',
            'status=no',
            'menubar=no',
            'fullscreen=yes' // Request fullscreen - might require user gesture to activate
        ].join(',');
        this.playerWindow = window.open(this.playerUrl, 'YouTubeJukeboxPlayer', features);
        if (!this.playerWindow) {
            console.error('Failed to open player window. Please allow popups for this site.');
            return;
        }
        this.isPlayerOpen = true;
        this.setupWindowCloseHandler();
        this.startStatusChecks();
        // Attempt to go fullscreen after a delay to allow window to initialize
        setTimeout(() => {
            try {
                // Try to force fullscreen mode
                if (this.playerWindow && !this.playerWindow.closed) {
                    // Try to press F11 programmatically (may not work in all browsers due to security)
                    // this.playerWindow.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 122, which: 122 }));
                    // Try to request fullscreen
                    const docEl = this.playerWindow.document.documentElement;
                    if (docEl.requestFullscreen) {
                        docEl.requestFullscreen();
                    }
                    else if (docEl.webkitRequestFullscreen) {
                        docEl.webkitRequestFullscreen();
                    }
                    else if (docEl.mozRequestFullScreen) {
                        docEl.mozRequestFullScreen();
                    }
                    else if (docEl.msRequestFullscreen) {
                        docEl.msRequestFullscreen();
                    }
                }
            }
            catch (e) {
                console.warn('Could not automatically enter fullscreen mode:', e);
            }
        }, 1000);
    }
    playVideo(videoId, title, artist) {
        this.sendCommand({
            action: 'play',
            videoId,
            title,
            artist
        });
    }
    pauseVideo() {
        this.sendCommand({ action: 'pause' });
    }
    stopVideo() {
        this.sendCommand({ action: 'stop' });
    }
    setVolume(volume) {
        this.sendCommand({
            action: 'setVolume',
            volume: Math.max(0, Math.min(100, volume))
        });
    }
    seekTo(time) {
        this.sendCommand({
            action: 'seek',
            time: Math.max(0, time)
        });
    }
    addStatusListener(callback) {
        this.statusListeners.push(callback);
        if (this.lastStatus) {
            callback(this.lastStatus);
        }
        return () => {
            this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
        };
    }
    sendCommand(command) {
        if (!this.isPlayerOpen || !this.playerWindow) {
            this.openPlayer();
            // Queue the command to be sent after a short delay when the window opens
            setTimeout(() => this.sendCommand(command), 1000);
            return;
        }
        try {
            localStorage.setItem(PlayerService.STORAGE_KEY, JSON.stringify({
                ...command,
                timestamp: Date.now()
            }));
            // Force storage event to fire in the same window
            window.dispatchEvent(new StorageEvent('storage', {
                key: PlayerService.STORAGE_KEY,
                newValue: JSON.stringify(command)
            }));
        }
        catch (error) {
            console.error('Failed to send command to player:', error);
        }
    }
    setupStorageListener() {
        window.addEventListener('storage', (event) => {
            if (event.key === `${PlayerService.STORAGE_KEY}_status` && event.newValue) {
                try {
                    const status = JSON.parse(event.newValue);
                    this.lastStatus = status;
                    this.statusListeners.forEach(callback => callback(status));
                    if (status.type === 'playerClosed') {
                        this.handlePlayerClosed();
                    }
                }
                catch (error) {
                    console.error('Error parsing player status:', error);
                }
            }
        });
    }
    setupWindowCloseHandler() {
        if (!this.playerWindow)
            return;
        const checkWindow = () => {
            if (this.playerWindow?.closed) {
                this.handlePlayerClosed();
            }
            else {
                setTimeout(checkWindow, 1000);
            }
        };
        checkWindow();
    }
    handlePlayerClosed() {
        this.isPlayerOpen = false;
        this.playerWindow = null;
        this.stopStatusChecks();
    }
    startStatusChecks() {
        this.stopStatusChecks();
        this.statusCheckInterval = window.setInterval(() => {
            if (this.playerWindow?.closed) {
                this.handlePlayerClosed();
            }
        }, 1000);
    }
    stopStatusChecks() {
        if (this.statusCheckInterval !== null) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }
    focusPlayer() {
        if (this.playerWindow && !this.playerWindow.closed) {
            this.playerWindow.focus();
            // Try to bring to front (may not work in all browsers)
            if (this.playerWindow.window) {
                this.playerWindow.window.focus();
            }
        }
    }
    isPlayerWindowOpen() {
        return this.isPlayerOpen && !this.playerWindow?.closed;
    }
}
PlayerService.STORAGE_KEY = 'youtube_jukebox_player';
// Export a singleton instance
export const playerService = new PlayerService();
// Add keyboard shortcut (Ctrl+P) to open player
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        playerService.openPlayer();
    }
});
//# sourceMappingURL=PlayerService.js.map