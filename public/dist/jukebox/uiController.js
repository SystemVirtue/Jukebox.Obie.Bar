import { YouTubePlayer } from '../player/ytPlayer.js';
import { PlaylistManager } from '../bgm/playlistManager.js';
import { PriorityQueue } from './priorityQueue.js';
import { CoinProcessor } from '../hardware/coinProcessor.js';
import { EventBus } from '../utils/eventBus.js';
export class UIController {
    constructor(playerContainerId) {
        this.player = new YouTubePlayer(playerContainerId);
        this.playlistManager = new PlaylistManager();
        this.queue = new PriorityQueue();
        this.coinProcessor = new CoinProcessor();
        this.initializeUI();
        this.setupEventListeners();
        this.setupErrorHandling();
    }
    initializeUI() {
        // Set up touch event handlers for all UI elements
        this.setupTouchListeners();
        // Configure CSS Grid layout
        this.setupGridLayout();
        // Initialize player once YouTube API is ready
        this.player.setOnReadyCallback(() => {
            this.startInactivityTimer();
            this.checkQueue();
        });
    }
    setupTouchListeners() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.classList.contains('video-thumbnail')) {
                this.handleVideoSelection(target.dataset.videoId);
            }
        });
    }
    setupGridLayout() {
        const grid = document.createElement('div');
        grid.className = 'video-grid';
        document.getElementById('thumbnails-container')?.appendChild(grid);
    }
    setupErrorHandling() {
        const eventBus = EventBus.getInstance();
        // Handle emergency stop
        eventBus.subscribe('emergency-stop', () => {
            this.player.stopVideo();
            this.queue = new PriorityQueue(); // Clear queue
            this.showMessage('Emergency stop activated');
        });
        // Handle system reset
        eventBus.subscribe('system-reset', () => {
            this.queue = new PriorityQueue();
            this.playRandomBackgroundVideo();
        });
        // Handle API key rotation
        eventBus.subscribe('api-key-rotated', (detail) => {
            if (!detail.success) {
                this.showMessage('API key rotation failed');
            }
        });
    }
    async handleVideoSelection(videoId) {
        try {
            if (this.queue.getTotalCredits() < 1) {
                this.showMessage('Please insert coins to play videos');
                return;
            }
            this.queue.add(videoId, true);
            this.resetInactivityTimer();
            this.checkQueue();
            EventBus.getInstance().emit('video-selected', { videoId });
        }
        catch (error) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error selecting video: ${error}`);
            EventBus.getInstance().emit('error', {
                source: 'UIController',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    checkQueue() {
        if (this.queue.isEmpty()) {
            this.playRandomBackgroundVideo();
        }
        else {
            const next = this.queue.pop();
            if (next) {
                this.player.loadVideo(next.videoId);
            }
        }
    }
    async playRandomBackgroundVideo() {
        try {
            const defaultPlaylists = this.playlistManager.getDefaultPlaylists();
            const randomPlaylist = defaultPlaylists[Math.floor(Math.random() * defaultPlaylists.length)];
            const playlist = await this.playlistManager.loadPlaylist(randomPlaylist);
            const randomVideo = playlist[Math.floor(Math.random() * playlist.length)];
            this.player.loadVideo(randomVideo.videoId);
        }
        catch (error) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] BGM error: ${error}`);
        }
    }
    startInactivityTimer() {
        this.inactivityTimer = window.setTimeout(() => {
            if (this.queue.isEmpty()) {
                this.playRandomBackgroundVideo();
            }
        }, UIController.INACTIVITY_TIMEOUT);
    }
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        this.startInactivityTimer();
    }
    showMessage(message) {
        const messageElement = document.getElementById('message-display');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.classList.add('visible');
            setTimeout(() => {
                messageElement.classList.remove('visible');
            }, 3000);
        }
    }
    setupEventListeners() {
        // Watch for coin insertions
        this.coinProcessor.setOnCreditCallback((credits) => {
            try {
                this.queue.add('', false, credits);
                const totalCredits = this.queue.getTotalCredits();
                this.showMessage(`Credits: ${totalCredits}`);
            }
            catch (error) {
                if (error instanceof Error && error.message === 'CreditOverflow') {
                    this.showMessage('Maximum credits reached');
                }
            }
        });
        // Watch for video state changes
        document.addEventListener('youtube-state-change', ((event) => {
            if (event.detail.state === YT.PlayerState.ENDED) {
                this.checkQueue();
            }
        }));
        // Handle keyboard shortcuts for admin mode
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 'j') {
                this.enterAdminMode();
            }
        });
    }
    enterAdminMode() {
        const password = prompt('Enter admin password:');
        if (password === 'admin123') { // Should use environment variable in production
            // Wait for physical button hold
            let buttonHoldTimer;
            const physicalButton = document.getElementById('admin-button');
            if (physicalButton) {
                physicalButton.addEventListener('mousedown', () => {
                    buttonHoldTimer = window.setTimeout(() => {
                        // Show admin dashboard
                        document.getElementById('admin-dashboard')?.classList.remove('hidden');
                    }, 3000);
                });
                physicalButton.addEventListener('mouseup', () => {
                    clearTimeout(buttonHoldTimer);
                });
            }
        }
    }
}
UIController.INACTIVITY_TIMEOUT = 60000; // 60 seconds
//# sourceMappingURL=uiController.js.map