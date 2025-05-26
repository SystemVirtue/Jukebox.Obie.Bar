import { EventBus } from '../utils/eventBus';
import { YouTubeConfig } from '../config/youtube.config';
import { SecurityConfig } from '../config/security.config';
import { CoinProcessor } from '../hardware/CoinProcessor';
import { loadOutsideObiePlaylists } from './loadOutsideObiePlaylists';

/**
 * Admin Panel implementation for YouTube Jukebox X1
 * This class handles all admin dashboard functionality
 */
class AdminPanel {
    private eventBus = EventBus.getInstance();
    private coinProcessor: CoinProcessor | null = null;
    private activeSection = 'dashboard';
    private connectionCheckerInterval: number | null = null;
    private logEntries: any[] = [];
    private mainJukeboxWindow: Window | null = null;

    constructor() {
        this.initializeUi();
        this.loadStoredData();
        this.startConnectionChecker();
        this.setupEventListeners();
        
        // Initialize coin processor
        this.coinProcessor = new CoinProcessor();
        this.updateCreditDisplay(this.coinProcessor.getCredits());
        
        // Setup callback for credit changes
        this.coinProcessor.setOnCreditCallback((credits: number) => {
            this.updateCreditDisplay(credits);
        });
        
        this.log('Admin dashboard initialized', 'info');
    }

    /**
     * Initialize UI elements
     */
    private initializeUi(): void {
        // Set up tab navigation
        const navLinks = document.querySelectorAll('.admin-sidebar a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = (e.currentTarget as HTMLAnchorElement).getAttribute('href')?.substring(1);
                if (target) {
                    this.showSection(target);
                }
            });
        });

        // Setup forms
        document.getElementById('credit-settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCreditSettings();
        });

        document.getElementById('settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemSettings();
        });
    }

    /**
     * Load stored data from localStorage
     */
    private loadStoredData(): void {
        // Load logs
        try {
            const storedLogs = localStorage.getItem('jukebox_admin_logs');
            if (storedLogs) {
                this.logEntries = JSON.parse(storedLogs);
                this.renderLogs();
            }
        } catch (e) {
            console.error('Error loading logs:', e);
        }

        // Load playlists from @OutsideObie channel
        try {
            // Always pass API key from config or environment to playlist loader
            let apiKey = '';
            // Try to get from config first
            if (YouTubeConfig.api && YouTubeConfig.api.params && YouTubeConfig.api.params.key && YouTubeConfig.api.params.key !== 'YOUR-API-KEY') {
                apiKey = YouTubeConfig.api.params.key;
            } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY) {
                apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            } else if (window && window.YOUTUBE_API_KEY) {
                apiKey = window.YOUTUBE_API_KEY;
            }
            if (!apiKey || apiKey === 'YOUR-API-KEY' || apiKey === 'undefined') {
                this.log('YouTube API key is missing or invalid. Please set it in your .env file.', 'error');
            }
            loadOutsideObiePlaylists(apiKey, this.log.bind(this));
        } catch (e) {
            console.error('Error loading playlists:', e);
        }

        // Load system settings
        try {
            const storedSettings = localStorage.getItem('jukebox_settings');
            if (storedSettings) {
                const settings = JSON.parse(storedSettings);
                
                // Apply settings to form
                if (settings.idleTimeout) {
                    (document.getElementById('idle-timeout') as HTMLInputElement).value = settings.idleTimeout.toString();
                }
                
                if (settings.transitionEffect) {
                    (document.getElementById('transition-effect') as HTMLSelectElement).value = settings.transitionEffect;
                }
                
                // Don't set API key in the form for security
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }

        // Load credit settings
        try {
            const creditSettings = localStorage.getItem('jukebox_credit_settings');
            if (creditSettings) {
                const settings = JSON.parse(creditSettings);
                
                if (settings.dollarOneValue) {
                    (document.getElementById('dollar-one-value') as HTMLInputElement).value = settings.dollarOneValue.toString();
                }
                
                if (settings.dollarTwoValue) {
                    (document.getElementById('dollar-two-value') as HTMLInputElement).value = settings.dollarTwoValue.toString();
                }
                
                if (settings.maxCredits) {
                    (document.getElementById('max-credits') as HTMLInputElement).value = settings.maxCredits.toString();
                }
            }
        } catch (e) {
            console.error('Error loading credit settings:', e);
        }
    }

    /**
     * Set up event listeners for all interactive elements
     */
    private setupEventListeners(): void {
        // Dashboard actions
        document.getElementById('emergency-stop')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to perform an emergency stop? This will immediately stop all playback.')) {
                this.emergencyStop();
            }
        });
        
        document.getElementById('restart-system')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to restart the system?')) {
                this.restartSystem();
            }
        });
        
        document.getElementById('test-coin-acceptor')?.addEventListener('click', () => {
            this.testCoinAcceptor(); // Now functions as Add Credits
        });
        
        document.getElementById('cancel-credit')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all credits to 0?')) {
                this.cancelCredit();
            }
        });
        
        // Payment system
        document.getElementById('connect-coin-acceptor')?.addEventListener('click', () => {
            this.connectCoinAcceptor();
        });
        
        document.getElementById('add-credits-btn')?.addEventListener('click', () => {
            const input = document.getElementById('add-credits') as HTMLInputElement;
            const amount = parseInt(input.value, 10);
            if (!isNaN(amount) && amount > 0) {
                this.addCreditsManually(amount);
            }
        });
        
        document.getElementById('reset-credits')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all credits to 0?')) {
                this.resetCredits();
            }
        });
        
        // Log actions
        document.getElementById('refresh-logs')?.addEventListener('click', () => {
            this.refreshLogs();
        });
        
        document.getElementById('export-logs')?.addEventListener('click', () => {
            this.exportLogs();
        });
        
        document.getElementById('clear-logs')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all logs?')) {
                this.clearLogs();
            }
        });
        
        document.getElementById('log-level')?.addEventListener('change', () => {
            this.filterLogs();
        });
        
        // API key controls
        document.getElementById('show-api-key')?.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                (document.getElementById('show-api-key') as HTMLButtonElement).textContent = 'Hide';
            } else {
                apiKeyInput.type = 'password';
                (document.getElementById('show-api-key') as HTMLButtonElement).textContent = 'Show';
            }
        });
        
        document.getElementById('test-api-key')?.addEventListener('click', () => {
            this.testApiKey();
        });
        
        document.getElementById('reset-defaults')?.addEventListener('click', () => {
            if (confirm('Reset all settings to default values?')) {
                this.resetToDefaults();
            }
        });
        
        // Setup jukebox controls
        this.setupJukeboxControls();
    }

    /**
     * Initialize the playlists tab
     */
    private initializePlaylists(): void {
        document.getElementById('load-playlist-btn')?.addEventListener('click', () => {
            const input = document.getElementById('playlist-url') as HTMLInputElement;
            const url = input.value.trim();
            
            if (url) {
                // Extract playlist ID from URL
                const regex = /[?&]list=([^&]+)/;
                const match = url.match(regex);
                
                if (match && match[1]) {
                    this.loadPlaylistVideos(match[1]);
                } else {
                    this.log('Invalid playlist URL', 'error');
                }
            }
        });
    }
    
    /**
     * Load videos from a specific YouTube playlist
     * @param playlistId YouTube playlist ID to load
     */
    private async loadPlaylistVideos(playlistId: string): Promise<void> {
        try {
            // Show loading indicator
            const videosContainer = document.getElementById('playlist-videos-container');
            if (!videosContainer) {
                this.log('Videos container not found', 'error');
                return;
            }
            
            videosContainer.innerHTML = '<div class="loading">Loading videos from playlist...</div>';
            this.log(`Loading videos from playlist ID: ${playlistId}`, 'info');
            
            // Get API key from config
            let apiKey = '';
            if (YouTubeConfig.api && YouTubeConfig.api.params && YouTubeConfig.api.params.key) {
                apiKey = YouTubeConfig.api.params.key;
            } else if (import.meta.env.VITE_YOUTUBE_API_KEY) {
                apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            }
            
            if (!apiKey || apiKey === 'YOUR-API-KEY') {
                throw new Error('YouTube API key is missing or invalid');
            }
            
            // Fetch playlist videos from YouTube API
            const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to load playlist videos');
            }
            
            // Clear and update the videos container
            if (data.items && data.items.length > 0) {
                let html = '<div class="playlist-videos">';
                
                // Add videos to container
                for (const item of data.items) {
                    const videoId = item.snippet.resourceId.videoId;
                    const title = item.snippet.title;
                    const thumbnail = item.snippet.thumbnails?.default?.url || '';
                    
                    html += `
                        <div class="video-item" data-id="${videoId}">
                            <img src="${thumbnail}" alt="${title}" />
                            <div class="video-info">
                                <div class="video-title">${title}</div>
                                <button class="add-video-btn" data-id="${videoId}">Add to Queue</button>
                            </div>
                        </div>
                    `;
                }
                
                html += '</div>';
                videosContainer.innerHTML = html;
                
                // Add event listeners for Add to Queue buttons
                const addButtons = videosContainer.querySelectorAll('.add-video-btn');
                addButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const videoId = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
                        if (videoId) {
                            this.sendCommandToJukebox('addVideo', { videoId });
                            this.log(`Added video ${videoId} to queue`, 'info');
                            alert('Video added to queue!');
                        }
                    });
                });
                
                this.log(`Loaded ${data.items.length} videos from playlist`, 'info');
            } else {
                videosContainer.innerHTML = '<div class="no-content">No videos found in this playlist</div>';
                this.log('No videos found in playlist', 'warning');
            }
        } catch (error) {
            console.error('Error loading playlist videos:', error);
            const videosContainer = document.getElementById('playlist-videos-container');
            if (videosContainer) {
                videosContainer.innerHTML = `<div class="error">Error loading playlist videos: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
            }
            this.log(`Error loading playlist videos: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    }
    
    /**
     * Load playlists from @OutsideObie channel
     */
    private async initializePlaylistsTab(): Promise<void> {
        try {
            // First, check if the playlists tab is set up
            const playlistsContainer = document.getElementById('saved-playlists');
            if (!playlistsContainer) {
                this.log('Playlists container not found, delaying initialization', 'warning');
                setTimeout(() => this.initializePlaylistsTab(), 1000);
                return;
            }
            
            // Add loading indicator
            playlistsContainer.innerHTML = '<div class="loading">Loading playlists from @OutsideObie channel...</div>';
            
            // Load playlists from the OutsideObie channel
            // Get API key from config
            let apiKey = '';
            if (YouTubeConfig.api && YouTubeConfig.api.params && YouTubeConfig.api.params.key) {
                apiKey = YouTubeConfig.api.params.key;
            } else if (import.meta.env.VITE_YOUTUBE_API_KEY) {
                apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            }
            
            await loadOutsideObiePlaylists(apiKey, (message, level) => {
                this.log(message, level as any);
            });
            
            // Add event listeners to the playlist load buttons
            const loadButtons = document.querySelectorAll('.load-playlist');
            loadButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const playlistId = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
                    if (playlistId) {
                        this.loadPlaylistVideos(playlistId);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error initializing playlists tab:', error);
            this.log('Error loading playlists from @OutsideObie channel', 'error');
        }
    }

    /**
     * Setup jukebox playback controls
     */
    private setupJukeboxControls(): void {
        document.getElementById('play-button')?.addEventListener('click', () => {
            this.sendCommandToJukebox('play');
        });
        
        document.getElementById('pause-button')?.addEventListener('click', () => {
            this.sendCommandToJukebox('pause');
        });
        
        document.getElementById('skip-button')?.addEventListener('click', () => {
            this.sendCommandToJukebox('skip');
        });
        
        document.getElementById('stop-button')?.addEventListener('click', () => {
            this.sendCommandToJukebox('stop');
        });
        
        document.getElementById('volume-down')?.addEventListener('click', () => {
            const slider = document.getElementById('volume-slider') as HTMLInputElement;
            const newValue = Math.max(0, parseInt(slider.value, 10) - 10);
            slider.value = newValue.toString();
            this.sendCommandToJukebox('volume', { level: newValue });
        });
        
        document.getElementById('volume-up')?.addEventListener('click', () => {
            const slider = document.getElementById('volume-slider') as HTMLInputElement;
            const newValue = Math.min(100, parseInt(slider.value, 10) + 10);
            slider.value = newValue.toString();
            this.sendCommandToJukebox('volume', { level: newValue });
        });
        
        document.getElementById('volume-slider')?.addEventListener('change', (e) => {
            const slider = e.target as HTMLInputElement;
            this.sendCommandToJukebox('volume', { level: parseInt(slider.value, 10) });
        });
        
        document.getElementById('mute-button')?.addEventListener('click', () => {
            this.sendCommandToJukebox('mute');
        });
        
        document.getElementById('clear-queue')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire queue?')) {
                this.sendCommandToJukebox('clearQueue');
            }
        });
        
        document.getElementById('add-video')?.addEventListener('click', () => {
            const videoId = prompt('Enter YouTube video ID to add to queue:');
            if (videoId) {
                this.sendCommandToJukebox('addVideo', { videoId });
            }
        });
    }

    /**
     * Send a command to the main jukebox window
     */
    private sendCommandToJukebox(command: string, params: any = {}): void {
        if (!this.mainJukeboxWindow || this.mainJukeboxWindow.closed) {
            // Try to find the jukebox window or open a new one
            try {
                const windows = window.opener ? [window.opener] : [];
                // Add any windows opened by this window
                for (let i = 0; i < window.frames.length; i++) {
                    windows.push(window.frames[i]);
                }
                
                // Find a window with the jukebox container
                for (const win of windows) {
                    try {
                        if (win.document.getElementById('jukebox-container')) {
                            this.mainJukeboxWindow = win;
                            break;
                        }
                    } catch (e) {
                        // Ignore cross-origin errors
                    }
                }
                
                // If still not found, open a new window
                if (!this.mainJukeboxWindow) {
                    this.mainJukeboxWindow = window.open('/', 'jukebox', 'width=1280,height=1024');
                }
            } catch (e) {
                this.log(`Error finding jukebox window: ${e}`, 'error');
                alert('Could not connect to jukebox. Please ensure the main application is running.');
                return;
            }
        }
        
        try {
            // Post message to the jukebox window
            if (this.mainJukeboxWindow) {
                this.mainJukeboxWindow.postMessage({
                    source: 'admin-dashboard',
                    command,
                    params
                }, window.location.origin);
                
                this.log(`Sent command to jukebox: ${command}`, 'info');
            } else {
                this.log('Cannot send command: Main jukebox window not available', 'error');
            }
        } catch (e) {
            this.log(`Error sending command to jukebox: ${e}`, 'error');
            alert('Failed to send command to jukebox.');
        }
    }

    /**
     * Start periodic connection checker
     */
    private startConnectionChecker(): void {
        // Update connection status immediately
        this.updateConnectionStatus();
        
        // Check connection status every 30 seconds
        this.connectionCheckerInterval = window.setInterval(() => {
            this.updateConnectionStatus();
        }, 30000);
    }

    /**
     * Update the connection status indicator
     */
    private updateConnectionStatus(): void {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            try {
                // Check if we can connect to the main page
                fetch(window.location.origin, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            statusElement.textContent = 'Connected';
                            statusElement.className = 'online';
                        } else {
                            statusElement.textContent = 'Connection issues';
                            statusElement.className = 'warning';
                        }
                    })
                    .catch(() => {
                        statusElement.textContent = 'Disconnected';
                        statusElement.className = 'offline';
                    });
            } catch (e) {
                statusElement.textContent = 'Connection error';
                statusElement.className = 'offline';
            }
        }
    }

    /**
     * Show a specific section of the admin dashboard
     */
    private showSection(sectionId: string): void {
        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the requested section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.activeSection = sectionId;
            
            // Update the active nav link
            const navLinks = document.querySelectorAll('.admin-sidebar a');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
            
            // If switching to the payments section, refresh the coin acceptor status
            if (sectionId === 'payments') {
                this.updateCoinAcceptorStatus(this.coinProcessor?.isConnected || false);
            }
        }
    }

    /**
     * Connect to the coin acceptor device
     */
    private async connectCoinAcceptor(): Promise<void> {
        try {
            if (!this.coinProcessor) {
                this.coinProcessor = new CoinProcessor();
            }
            
            const connected = await this.coinProcessor.connect();
            if (connected) {
                this.updateCoinAcceptorStatus(true);
                this.log('Connected to coin acceptor', 'info');
            } else {
                this.updateCoinAcceptorStatus(false);
                this.log('Failed to connect to coin acceptor', 'error');
            }
        } catch (e) {
            this.log(`Error connecting to coin acceptor: ${e}`, 'error');
            this.updateCoinAcceptorStatus(false);
        }
    }

    /**
     * Update the coin acceptor status display
     */
    private updateCoinAcceptorStatus(connected: boolean = false): void {
        const statusElement = document.getElementById('coin-connection-status');
        const portElement = document.getElementById('coin-port');
        const creditsElement = document.getElementById('coin-credits');
        
        if (statusElement && portElement && creditsElement) {
            if (connected) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'online';
                portElement.textContent = 'usbserial-1420'; // This would normally come from the actual device
            } else {
                statusElement.textContent = 'Not connected';
                statusElement.className = 'offline';
                portElement.textContent = '--';
            }
            
            // Always update credits
            if (this.coinProcessor) {
                creditsElement.textContent = this.coinProcessor.getCredits().toString();
            } else {
                creditsElement.textContent = '0';
            }
        }
    }

    /**
     * Update credit display throughout the admin panel
     */
    private updateCreditDisplay(credits: number): void {
        // Update in payments section
        const coinCreditsElement = document.getElementById('coin-credits');
        if (coinCreditsElement) {
            coinCreditsElement.textContent = credits.toString();
        }
        
        // Update in dashboard
        const creditBalanceElement = document.getElementById('credit-balance');
        if (creditBalanceElement) {
            creditBalanceElement.textContent = credits.toString();
        }
    }

    /**
     * Test the coin acceptor by simulating coin inserts
     */
    private testCoinAcceptor(): void {
        // Create a test notification to simulate a coin
        const testCoins = ['a', 'b'];
        const randomCoin = testCoins[Math.floor(Math.random() * testCoins.length)];
        
        // Simulate a coin being inserted
        const dataString = randomCoin === 'a' ? '$1 Coin (1 credit)' : '$2 Coin (3 credits)';
        
        if (this.coinProcessor) {
            // Create a Uint8Array with the coin character
            const encoder = new TextEncoder();
            const data = encoder.encode(randomCoin);
            
            // Process the data as if it came from the serial port
            this.coinProcessor['processSerialData'](data);
            
            this.log(`Test coin inserted: ${dataString}`, 'info');
        } else {
            this.log('Coin processor not initialized', 'error');
        }
    }
    
    /**
     * Cancel all credits by resetting to zero
     */
    private cancelCredit(): void {
        if (this.coinProcessor) {
            const currentCredits = this.coinProcessor.getCredits();
            // Ensure we properly reset credits to 0
            this.coinProcessor.resetCredits();
            // Force update UI displays
            this.updateCreditDisplay(0);
            // Update status displays
            this.updateCoinAcceptorStatus(this.coinProcessor.isConnected);
            // Send event notification for other components
            this.eventBus.emit('credits-changed', { 
                total: 0, 
                change: -currentCredits, 
                reason: 'admin-reset' 
            });
            this.log(`Canceled ${currentCredits} credits, reset to 0`, 'warning');
        } else {
            this.log('Coin processor not initialized', 'error');
        }
    }
    
    /**
     * Display real-time serial monitor for coin mechanism
     */
    private viewSerialIO(): void {
        // Create modal dialog for serial monitor
        const modal = document.createElement('div');
        modal.className = 'serial-monitor-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'serial-monitor-content';
        
        const header = document.createElement('div');
        header.className = 'serial-monitor-header';
        header.innerHTML = `
            <h3>Coin Mechanism Serial Monitor</h3>
            <button class="close-btn">×</button>
        `;
        
        const status = document.createElement('div');
        status.className = 'serial-status';
        status.innerHTML = `<span class="status-label">Status:</span> <span class="status-value" id="serial-connection-status">Checking...</span>`;
        
        const logContainer = document.createElement('div');
        logContainer.className = 'serial-log-container';
        const serialLog = document.createElement('pre');
        serialLog.className = 'serial-log';
        serialLog.id = 'serial-log';
        logContainer.appendChild(serialLog);
        
        const controls = document.createElement('div');
        controls.className = 'serial-controls';
        controls.innerHTML = `
            <button id="clear-serial-log">Clear Log</button>
            <button id="refresh-connection">Refresh Connection</button>
        `;
        
        modalContent.appendChild(header);
        modalContent.appendChild(status);
        modalContent.appendChild(logContainer);
        modalContent.appendChild(controls);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Setup event listeners
        const closeBtn = header.querySelector('.close-btn');
        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('clear-serial-log')?.addEventListener('click', () => {
            if (serialLog) serialLog.textContent = '';
        });
        
        document.getElementById('refresh-connection')?.addEventListener('click', () => {
            this.connectCoinAcceptor();
            if (this.coinProcessor) {
                const statusEl = document.getElementById('serial-connection-status');
                if (statusEl) statusEl.textContent = this.coinProcessor.isConnected ? 'Connected' : 'Disconnected';
                
                this.addSerialLogEntry('Connection refresh requested');
            }
        });
        
        // Initial status update
        const statusEl = document.getElementById('serial-connection-status');
        if (statusEl && this.coinProcessor) {
            statusEl.textContent = this.coinProcessor.isConnected ? 'Connected' : 'Disconnected';
            const portInfo = this.coinProcessor.getPortInfo();
            this.addSerialLogEntry(`Monitor started. Port: ${portInfo || 'Not connected'}`);
        } else if (statusEl) {
            statusEl.textContent = 'Disconnected';
            this.addSerialLogEntry('Monitor started. Port: Not connected');
        }
        
        // Set up serial monitoring
        if (this.coinProcessor) {
            this.coinProcessor.setSerialCallback((message: string) => {
                this.addSerialLogEntry(message);
            });
        }
    }
    
    /**
     * Add entry to serial log
     */
    private addSerialLogEntry(message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        const serialLog = document.getElementById('serial-log');
        if (serialLog) {
            serialLog.textContent = serialLog.textContent + '\n' + logEntry;
            serialLog.scrollTop = serialLog.scrollHeight;
        }
    }

    /**
     * Reset credits to zero
     */
    private resetCredits(): void {
        try {
            localStorage.setItem('jukebox_credits', '0');
            
            if (this.coinProcessor) {
                // Force a reload of the credits
                this.coinProcessor['loadCredits']();
                this.updateCreditDisplay(0);
            }
            
            this.log('Credits reset to 0', 'info');
        } catch (e) {
            this.log(`Error resetting credits: ${e}`, 'error');
        }
    }
    
    /**
     * Add credits manually to the system
     * @param amount Number of credits to add
     */
    private addCreditsManually(amount: number): void {
        try {
            if (!this.coinProcessor) {
                this.log('Coin processor not initialized', 'error');
                return;
            }
            
            // Get current credits
            const currentCredits = this.coinProcessor.getCredits();
            const newCredits = currentCredits + amount;
            
            // Save to local storage
            localStorage.setItem('jukebox_credits', newCredits.toString());
            
            // Update the coin processor
            this.coinProcessor['loadCredits']();
            this.updateCreditDisplay(newCredits);
            
            // Notify other components via event bus
            this.eventBus.emit('credits-changed', {
                total: newCredits,
                change: amount,
                reason: 'admin-add'
            });
            
            this.log(`Added ${amount} credits manually. New balance: ${newCredits}`, 'info');
        } catch (e) {
            this.log(`Error adding credits: ${e}`, 'error');
        }
    }

    /**
     * Save credit settings
     */
    private saveCreditSettings(): void {
        try {
            const dollarOneValue = parseInt((document.getElementById('dollar-one-value') as HTMLInputElement).value, 10);
            const dollarTwoValue = parseInt((document.getElementById('dollar-two-value') as HTMLInputElement).value, 10);
            const maxCredits = parseInt((document.getElementById('max-credits') as HTMLInputElement).value, 10);
            
            const settings = {
                dollarOneValue,
                dollarTwoValue,
                maxCredits
            };
            
            localStorage.setItem('jukebox_credit_settings', JSON.stringify(settings));
            this.log('Credit settings saved', 'info');
            
            alert('Credit settings saved successfully');
        } catch (e) {
            this.log(`Error saving credit settings: ${e}`, 'error');
            alert('Error saving credit settings');
        }
    }

    /**
     * Save system settings
     */
    private saveSystemSettings(): void {
        try {
            const idleTimeout = parseInt((document.getElementById('idle-timeout') as HTMLInputElement).value, 10);
            const transitionEffect = (document.getElementById('transition-effect') as HTMLSelectElement).value;
            const apiKey = (document.getElementById('api-key') as HTMLInputElement).value;
            const adminPassword = (document.getElementById('admin-password') as HTMLInputElement).value;
            const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
            
            // Validate passwords if provided
            if (adminPassword) {
                if (adminPassword !== confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }
                
                if (adminPassword.length < 8) {
                    alert('Password must be at least 8 characters long');
                    return;
                }
                
                // Save the password (in a real app, this would be properly hashed)
                localStorage.setItem('jukebox_admin_password', adminPassword);
            }
            
            // Save API key if provided
            if (apiKey && apiKey.trim() !== '') {
                localStorage.setItem('jukebox_api_key', apiKey);
            }
            
            // Save other settings
            const settings = {
                idleTimeout,
                transitionEffect
            };
            
            localStorage.setItem('jukebox_settings', JSON.stringify(settings));
            this.log('System settings saved', 'info');
            
            alert('Settings saved successfully');
            
            // Clear password fields
            (document.getElementById('admin-password') as HTMLInputElement).value = '';
            (document.getElementById('confirm-password') as HTMLInputElement).value = '';
        } catch (e) {
            this.log(`Error saving settings: ${e}`, 'error');
            alert('Error saving settings');
        }
    }

    /**
     * Test the YouTube API key
     */
    private async testApiKey(): Promise<void> {
        const apiKey = (document.getElementById('api-key') as HTMLInputElement).value;
        if (!apiKey || apiKey.trim() === '') {
            alert('Please enter an API key to test');
            return;
        }
        
        try {
            // Test the API key with a simple request
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${apiKey}`);
            const data = await response.json();
            
            if (response.ok && data.items && data.items.length > 0) {
                alert('API Key is valid!');
                this.log('YouTube API key test successful', 'info');
            } else {
                alert(`API Key test failed: ${data.error?.message || 'Unknown error'}`);
                this.log(`YouTube API key test failed: ${data.error?.message}`, 'error');
            }
        } catch (e) {
            alert(`Error testing API key: ${e}`);
            this.log(`Error testing YouTube API key: ${e}`, 'error');
        }
    }

    /**
     * Emergency stop function
     */
    private emergencyStop(): void {
        // Send emergency stop event
        this.eventBus.emit('emergency-stop', undefined);
        
        // Send command to jukebox
        this.sendCommandToJukebox('emergencyStop');
        
        this.log('Emergency stop triggered', 'warning');
    }

    /**
     * Restart the system
     */
    private restartSystem(): void {
        try {
            // Send system reset event
            this.eventBus.emit('system-reset', { success: true });
            
            // Send command to jukebox
            this.sendCommandToJukebox('restart');
            
            this.log('System restart initiated', 'warning');
            
            // Reload the admin page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (e) {
            this.log(`Error during system restart: ${e}`, 'error');
            this.eventBus.emit('system-reset', { success: false });
        }
    }

    /**
     * Reset all settings to defaults
     */
    private resetToDefaults(): void {
        // Reset form values
        (document.getElementById('idle-timeout') as HTMLInputElement).value = '300';
        (document.getElementById('transition-effect') as HTMLSelectElement).value = 'fade';
        (document.getElementById('dollar-one-value') as HTMLInputElement).value = '1';
        (document.getElementById('dollar-two-value') as HTMLInputElement).value = '3';
        (document.getElementById('max-credits') as HTMLInputElement).value = '255';
        
        // Clear password fields
        (document.getElementById('admin-password') as HTMLInputElement).value = '';
        (document.getElementById('confirm-password') as HTMLInputElement).value = '';
        
        this.log('Settings reset to defaults', 'info');
    }

    /**
     * Log a message to the admin console
     */
    private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-CA', { hour12: false });
        
        const logEntry = {
            time: timeString,
            message,
            level,
            timestamp: now.getTime()
        };
        
        // Add to log entries
        this.logEntries.push(logEntry);
        
        // Trim logs if needed (keep last 1000 entries)
        if (this.logEntries.length > 1000) {
            this.logEntries = this.logEntries.slice(-1000);
        }
        
        // Save logs
        this.saveLogs();
        
        // Update log display if we're on the logs section
        if (this.activeSection === 'logs') {
            this.renderLogs();
        }
        
        // Console log for debugging
        console.log(`[${timeString}] [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Save logs to localStorage
     */
    private saveLogs(): void {
        try {
            localStorage.setItem('jukebox_admin_logs', JSON.stringify(this.logEntries));
        } catch (e) {
            console.error('Error saving logs:', e);
        }
    }

    /**
     * Render logs to the log viewer
     */
    private renderLogs(): void {
        const logViewer = document.getElementById('log-entries');
        if (!logViewer) return;
        
        // Get selected log level filter
        const levelFilter = (document.getElementById('log-level') as HTMLSelectElement).value;
        
        // Filter logs based on level
        let filteredLogs = this.logEntries;
        if (levelFilter === 'error') {
            filteredLogs = this.logEntries.filter(entry => entry.level === 'error');
        } else if (levelFilter === 'warning') {
            filteredLogs = this.logEntries.filter(entry => entry.level === 'error' || entry.level === 'warning');
        } else if (levelFilter === 'info') {
            filteredLogs = this.logEntries;
        }
        
        // Sort logs by timestamp (newest first)
        filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Generate HTML
        let html = '';
        if (filteredLogs.length === 0) {
            html = '<div class="no-content">No logs to display</div>';
        } else {
            for (const log of filteredLogs) {
                html += `
                    <div class="log-entry ${log.level}">
                        <span class="log-time">${log.time}</span>
                        <span class="log-level">${log.level.toUpperCase()}</span>
                        <span class="log-message">${log.message}</span>
                    </div>
                `;
            }
        }
        
        logViewer.innerHTML = html;
    }

    /**
     * Refresh logs display
     */
    private refreshLogs(): void {
        this.renderLogs();
    }

    /**
     * Filter logs based on level
     */
    private filterLogs(): void {
        this.renderLogs();
    }

    /**
     * Export logs to a file
     */
    private exportLogs(): void {
        try {
            // Convert logs to CSV format
            let csv = 'Time,Level,Message\n';
            for (const log of this.logEntries) {
                // Escape quotes in the message
                const escapedMessage = log.message.replace(/"/g, '""');
                csv += `${log.time},"${log.level.toUpperCase()}","${escapedMessage}"\n`;
            }
            
            // Create a download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `jukebox_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.log('Logs exported to CSV', 'info');
        } catch (e) {
            this.log(`Error exporting logs: ${e}`, 'error');
            alert('Error exporting logs');
        }
    }

    /**
     * Clear all logs
     */
    private clearLogs(): void {
        this.logEntries = [];
        this.saveLogs();
        this.renderLogs();
        this.log('Logs cleared', 'info');
    }
}

// Initialize the admin panel when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
});
