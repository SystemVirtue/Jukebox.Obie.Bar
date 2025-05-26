import { YouTubePlayer } from './ytPlayer';

// Constants
const STORAGE_KEY = 'youtube_jukebox_player';
const STATUS_ELEMENT = document.getElementById('status') as HTMLElement;

// Player command and status interfaces
interface PlayerCommand {
  action: 'play' | 'pause' | 'stop' | 'setVolume' | 'seek';
  videoId?: string;
  title?: string;
  artist?: string;
  volume?: number;
  time?: number;
  timestamp?: number;
}

interface PlayerStatus {
  type: 'stateChange' | 'ready' | 'error' | 'playerClosed';
  state?: YT.PlayerState;
  videoId?: string;
  title?: string;
  artist?: string;
  volume?: number;
  isMuted?: boolean;
  currentTime?: number;
  duration?: number;
  error?: string;
  timestamp: number;
}

class PlayerWindow {
  private player: YouTubePlayer | null = null;
  private isInitialized: boolean = false;
  private currentVideoId: string | null = null;
  private currentTitle: string = '';
  private currentArtist: string = '';
  private isMuted: boolean = false;
  private volume: number = 70;
  private statusTimeout: number | null = null;
  private isRecovering: boolean = false;
  private recoveryAttempts: number = 0;
  private readonly MAX_RECOVERY_ATTEMPTS = 3;
  private lastPlaybackTime: number = 0;
  private lastVideoId: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Set up basic styles for optimal fullscreen viewing
      document.documentElement.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = '#000';

      // Create player container if it doesn't exist
      let container = document.getElementById('player-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'player-container';
        container.style.width = '100vw';
        container.style.height = '100vh';
        document.body.appendChild(container);
      }
      
      // Set window title
      document.title = 'YouTube Jukebox Player';
      
      // Apply special meta tags for mobile devices
      this.applyMobileFullscreenTags();

      // Initialize YouTube player with autoplay and mute settings for autoplay
      this.player = new YouTubePlayer('player-container', {
        playerVars: {
          autoplay: 1,      // Enable autoplay
          mute: 1,          // Start muted to ensure autoplay works
          controls: 0,      // Hide controls initially
          rel: 0,           // Don't show related videos
          fs: 1,            // Allow fullscreen
          modestbranding: 1 // Minimal YouTube branding
        }
      });
      
      // Set up player event handlers
      this.player.setOnReadyCallback(() => {
        console.log('Player is ready');
        this.isInitialized = true;
        this.updateStatus('Player ready');
       
        // Try to enter fullscreen automatically
        this.enterFullscreen();
        
        // Attempt to unmute after a slight delay (bypasses autoplay restrictions)
        setTimeout(() => {
          if (this.player) {
            this.player.unMute();
            this.player.setVolume(this.volume);
            console.log('Player unmuted for autoplay');
          }
        }, 1000);
        
        // Notify parent window that we're ready
        this.notifyMainWindow({ type: 'ready', timestamp: Date.now() });
      });

      this.player.setOnErrorCallback((event: YT.OnErrorEvent) => {
        console.error('Player error:', event);
        this.updateStatus(`Error: ${event.data}`);
        this.notifyMainWindow({
          type: 'error',
          error: `Player error: ${event.data}`,
          timestamp: Date.now()
        });
      });

      this.player.setOnStateChangeCallback((event: YT.OnStateChangeEvent) => {
        this.handlePlayerStateChange(event);
      });

      // Set up message listeners
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      
      // Try to enter fullscreen on any click
      document.addEventListener('click', this.enterFullscreen.bind(this));
      
      // Set up keyboard shortcuts
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      
      // Try to restore the last played video from localStorage
      this.restoreLastVideo();
      
    } catch (error) {
      console.error('Failed to initialize player:', error);
      this.updateStatus(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private handlePlayerStateChange(event: YT.OnStateChangeEvent): void {
    if (!this.player) return;
    
    const stateNames: Record<number, string> = {
      [-1]: 'UNSTARTED',
      0: 'ENDED',
      1: 'PLAYING',
      2: 'PAUSED',
      3: 'BUFFERING',
      5: 'VIDEO_CUED'
    };
    
    const state = event.data;
    console.log(`Player state changed to: ${stateNames[state] || state}`);
    
    // Track playback time for recovery
    if (state === YT.PlayerState.PLAYING) {
      // Start tracking current time periodically
      this.startPlaybackTracking();
    } else if (state === YT.PlayerState.ENDED) {
      // Reset tracking when video ends
      this.stopPlaybackTracking();
      this.lastPlaybackTime = 0;
    }
    
    // Update player state and notify main window
    this.updatePlayerState();
    
    // If video ends, save in local storage that it's completed
    if (state === YT.PlayerState.ENDED && this.currentVideoId) {
      localStorage.setItem(`video_completed_${this.currentVideoId}`, 'true');
    }
    
    // Update status display
    this.updateStatus(`${stateNames[state] || 'Unknown state'}`);
  }
  
  private startPlaybackTracking(): void {
    // Update current playback time every 5 seconds
    const trackingInterval = setInterval(() => {
      if (!this.player || !this.currentVideoId) {
        clearInterval(trackingInterval);
        return;
      }
      
      try {
        this.lastPlaybackTime = this.player.getCurrentTime();
        this.lastVideoId = this.currentVideoId;
        
        // Save to localStorage for potential recovery
        localStorage.setItem('last_video_id', this.lastVideoId);
        localStorage.setItem('last_playback_time', this.lastPlaybackTime.toString());
      } catch (error) {
        console.error('Error tracking playback:', error);
      }
    }, 5000);
  }
  
  private stopPlaybackTracking(): void {
    // This would clear any existing interval in a real implementation
  }
  
  private restoreLastVideo(): void {
    try {
      const lastVideoId = localStorage.getItem('last_video_id');
      const lastTimeStr = localStorage.getItem('last_playback_time');
      
      if (lastVideoId) {
        const lastTime = lastTimeStr ? parseFloat(lastTimeStr) : 0;
        
        // Only restore if the video wasn't marked as completed
        const isCompleted = localStorage.getItem(`video_completed_${lastVideoId}`) === 'true';
        
        if (!isCompleted) {
          console.log(`Restoring last video: ${lastVideoId} at ${lastTime}s`);
          setTimeout(() => {
            if (this.player && this.isInitialized) {
              this.handlePlayCommand(lastVideoId, 'Last played video', '');
              if (lastTime > 0) {
                setTimeout(() => this.player?.seekTo(lastTime), 1000);
              }
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error restoring last video:', error);
    }
  }
  
  private updatePlayerState(): void {
    if (!this.player) return;

    try {
      const videoData = this.player.getVideoData();
      const volume = this.player.getVolume();
      const isMuted = this.player.isMuted();
      const playerState = this.player.getPlayerState();
      const currentTime = this.player.getCurrentTime();
      const duration = this.player.getDuration();
      
      // Create a status object with all possible properties
      const status: PlayerStatus = {
        type: 'stateChange',
        state: playerState !== null ? playerState as YT.PlayerState : undefined,
        videoId: videoData?.video_id,
        title: videoData?.title,
        artist: videoData?.author,
        volume: volume,
        isMuted: isMuted,
        currentTime: currentTime,
        duration: duration,
        timestamp: Date.now()
      };
      
      this.notifyMainWindow(status);
    } catch (error) {
      console.error('Error updating player state:', error);
    }
  }

  private enterFullscreen(): void {
    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      } else {
        console.warn('Fullscreen API not supported');
      }
      
      // Add fullscreen change event listener
      document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
      document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
      
      this.updateStatus('Entering fullscreen mode');
    } catch (error) {
      console.error('Failed to enter fullscreen mode:', error);
      this.updateStatus('Failed to enter fullscreen mode');
    }
  }
  
  private handleFullscreenChange(): void {
    // Check if the document is in fullscreen mode
    const isFullscreen = !!document.fullscreenElement || 
                         !!(document as any).webkitFullscreenElement || 
                         !!(document as any).mozFullScreenElement || 
                         !!(document as any).msFullscreenElement;
    
    if (!isFullscreen) {
      console.log('Exited fullscreen mode, attempting to re-enter...');
      // Wait a moment before trying to re-enter fullscreen
      setTimeout(() => this.enterFullscreen(), 1000);
    }
  }
  
  private applyMobileFullscreenTags(): void {
    // Add meta tags for improved mobile fullscreen experience
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
      { name: 'mobile-web-app-capable', content: 'yes' }
    ];
    
    metaTags.forEach(tagInfo => {
      let meta = document.querySelector(`meta[name="${tagInfo.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', tagInfo.name);
        meta.setAttribute('content', tagInfo.content);
        document.head.appendChild(meta);
      }
    });
  }

  private handleStorageEvent(event: StorageEvent): void {
    // Check if the event is for our storage key
    if (event.key !== STORAGE_KEY) {
      return;
    }
    
    // Get the new value and ensure it's a string
    const newValue = event.newValue;
    if (newValue === null || newValue === undefined) {
      return;
    }
    
    try {
      // Parse the command from the storage event
      const command = JSON.parse(newValue) as PlayerCommand;
      this.handleCommand(command);
    } catch (error) {
      console.error('Error parsing command:', error);
    }
  }

  private handleCommand(command: PlayerCommand): void {
    if (!this.player) {
      console.warn('Player not initialized, command ignored:', command);
      return;
    }

    switch (command.action) {
      case 'play':
        if (command.videoId) {
          this.handlePlayCommand(command.videoId, command.title, command.artist);
        } else {
          this.player.playVideo();
        }
        break;
        
      case 'pause':
        this.player.pauseVideo();
        break;
        
      case 'stop':
        this.player.stopVideo();
        this.currentVideoId = null;
        this.currentTitle = '';
        this.currentArtist = '';
        break;
        
      case 'setVolume':
        if (typeof command.volume === 'number') {
          this.volume = command.volume;
          this.player.setVolume(this.volume);
          
          // Also unmute if needed
          if (this.player.isMuted()) {
            this.player.unMute();
            this.isMuted = false;
          }
        }
        break;
        
      case 'seek':
        if (typeof command.time === 'number') {
          this.player.seekTo(command.time);
        }
        break;
        
      default:
        console.warn('Unknown command:', command);
    }
  }

  private handlePlayCommand(videoId: string, title?: string, artist?: string): void {
    if (!this.player) return;
    
    // Store current video information
    this.currentVideoId = videoId;
    this.currentTitle = title || '';
    this.currentArtist = artist || '';
    this.lastVideoId = videoId;
    
    // Reset recovery state
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    
    // Clear completed status if previously marked
    localStorage.removeItem(`video_completed_${videoId}`);
    
    // Load and play the video
    this.player.loadVideo(videoId);
    
    // Ensure video is unmuted after loading (bypasses autoplay restrictions)
    setTimeout(() => {
      if (this.player) {
        this.player.unMute();
        this.player.setVolume(this.volume);
      }
    }, 1000);
    
    // Update status to show what's playing
    this.updateStatus(`Playing: ${title || videoId}`);
  }

  private updateStatus(message: string): void {
    if (!STATUS_ELEMENT) return;
    
    // Update the status element
    STATUS_ELEMENT.textContent = message;
    
    // Clear any existing timeout
    if (this.statusTimeout !== null) {
      window.clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }
    
    // Hide status after 3 seconds
    this.statusTimeout = window.setTimeout(() => {
      if (STATUS_ELEMENT) {
        STATUS_ELEMENT.textContent = '';
      }
      this.statusTimeout = null;
    }, 3000);
  }

  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    // Save current state before unloading
    if (this.currentVideoId) {
      localStorage.setItem('last_video_id', this.currentVideoId);
      
      if (this.player) {
        try {
          const currentTime = this.player.getCurrentTime();
          localStorage.setItem('last_playback_time', currentTime.toString());
        } catch (error) {
          console.error('Error saving playback time:', error);
        }
      }
    }
    
    // Notify the main window that we're closing
    this.notifyMainWindow({
      type: 'playerClosed',
      timestamp: Date.now()
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    switch (event.key) {
      case 'f': // Toggle fullscreen
        this.enterFullscreen();
        break;
        
      case ' ': // Space to play/pause
        if (this.player) {
          const state = this.player.getPlayerState();
          if (state === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
          } else {
            this.player.playVideo();
          }
        }
        break;
        
      case 'ArrowUp': // Volume up
        if (this.player) {
          this.volume = Math.min(100, this.volume + 5);
          this.player.setVolume(this.volume);
          this.updateStatus(`Volume: ${this.volume}%`);
        }
        break;
        
      case 'ArrowDown': // Volume down
        if (this.player) {
          this.volume = Math.max(0, this.volume - 5);
          this.player.setVolume(this.volume);
          this.updateStatus(`Volume: ${this.volume}%`);
        }
        break;
        
      case 'ArrowLeft': // Seek backward 10s
        if (this.player) {
          const currentTime = this.player.getCurrentTime();
          this.player.seekTo(Math.max(0, currentTime - 10));
        }
        break;
        
      case 'ArrowRight': // Seek forward 10s
        if (this.player) {
          const currentTime = this.player.getCurrentTime();
          this.player.seekTo(currentTime + 10);
        }
        break;
    }
  }

  private notifyMainWindow(status: PlayerStatus): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_status`, JSON.stringify(status));
      
      // Force a storage event in the current window to notify listeners
      window.dispatchEvent(new StorageEvent('storage', {
        key: `${STORAGE_KEY}_status`,
        newValue: JSON.stringify(status)
      }));
    } catch (error) {
      console.error('Failed to notify main window:', error);
    }
  }
}

// Initialize the player when the window loads
window.addEventListener('load', () => {
  const playerWindow = new PlayerWindow();
  // Make globally available for debugging
  (window as any).playerWindow = playerWindow;
});
