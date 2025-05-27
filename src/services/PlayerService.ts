interface PlayerCommand {
  action: 'play' | 'pause' | 'stop' | 'setVolume' | 'seek' | 'fadeOut';
  videoId?: string;
  title?: string;
  artist?: string;
  volume?: number;
  time?: number;
  duration?: number;
  timestamp: number;
}

interface PlayerStatus {
  type: 'stateChange' | 'error' | 'playerClosed' | 'ready' | 'loading' | 'playing' | 'paused' | 'ended' | 'stopped' | 'fadedOut' | 'volumeSet';
  state?: number | string; // Using number for YT.PlayerState enum values
  error?: string;
  timestamp: number;
}

export class PlayerService {
  private static readonly COMMAND_STORAGE_KEY = 'jukeboxCommand';
  private static readonly STATUS_STORAGE_KEY = 'jukeboxStatus';
  private playerWindow: Window | null = null;
  private statusCheckInterval: number | null = null;
  private isPlayerOpen = false;
  private lastStatus: PlayerStatus | null = null;
  private statusListeners: ((status: PlayerStatus) => void)[] = [];
  private readonly playerUrl: string;

  constructor() {
    // Ensure we use the absolute URL with origin for cross-environment compatibility
    this.playerUrl = `${window.location.origin}/player.html`;
    this.setupStorageListener();
  }

  public openPlayer(): void {
    // Close any existing player window to avoid duplicates
    if (this.playerWindow && !this.playerWindow.closed) {
      this.focusPlayer();
      return;
    }

    // Force close any existing player references
    try {
      if (this.playerWindow) {
        this.playerWindow.close();
      }
    } catch (e) {
      console.warn('Could not close existing player window:', e);
    }

    // Use screen dimensions for optimal fullscreen experience
    const features = [
      'popup=yes',
      `width=${window.screen.availWidth || 1024}`, // Use full screen width with fallback
      `height=${window.screen.availHeight || 768}`, // Use full screen height with fallback
      'left=0',
      'top=0',
      'scrollbars=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'menubar=no',
      'fullscreen=yes', // Request fullscreen - might require user gesture to activate
      '_blank' // Force new window
    ].join(',');

    // Ensure we use a unique target name and forced _blank for better cross-browser compatibility
    this.playerWindow = window.open(this.playerUrl, 'YouTubeJukeboxPlayer_' + Date.now(), features);
    
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
          } else if ((docEl as any).webkitRequestFullscreen) {
            (docEl as any).webkitRequestFullscreen();
          } else if ((docEl as any).mozRequestFullScreen) {
            (docEl as any).mozRequestFullScreen();
          } else if ((docEl as any).msRequestFullscreen) {
            (docEl as any).msRequestFullscreen();
          }
        }
      } catch (e) {
        console.warn('Could not automatically enter fullscreen mode:', e);
      }
    }, 1000);
  }

  public playVideo(videoId: string, title?: string, artist?: string): void {
    this.sendCommand({
      action: 'play',
      videoId,
      title,
      artist
    });
  }

  public pauseVideo(): void {
    this.sendCommand({ action: 'pause' });
  }

  public stopVideo(): void {
    this.sendCommand({ action: 'stop' });
  }

  public setVolume(volume: number): void {
    this.sendCommand({
      action: 'setVolume',
      volume: Math.max(0, Math.min(100, volume))
    });
  }

  public seekTo(time: number): void {
    this.sendCommand({
      action: 'seek',
      time: Math.max(0, time)
    });
  }

  public addStatusListener(callback: (status: PlayerStatus) => void): () => void {
    this.statusListeners.push(callback);
    if (this.lastStatus) {
      callback(this.lastStatus);
    }
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  public sendCommand(command: Omit<PlayerCommand, 'timestamp'>): void {
    if (!this.isPlayerOpen || !this.playerWindow) {
      this.openPlayer();
      // Queue the command to be sent after a short delay when the window opens
      setTimeout(() => this.sendCommand(command), 1000);
      return;
    }

    try {
      // Add timestamp to the command
      const commandWithTimestamp: PlayerCommand = {
        ...command,
        timestamp: Date.now()
      };
      
      // Store command in localStorage for the player window to pick up
      localStorage.setItem(
        PlayerService.COMMAND_STORAGE_KEY,
        JSON.stringify(commandWithTimestamp)
      );

      if (this.playerWindow && !this.playerWindow.closed) {
        // Ensure the player window is focused
        this.playerWindow.focus();
      } else {
        // If window reference is invalid, reopen it
        this.handlePlayerClosed();
      }
    } catch (e) {
      console.error('Failed to send command to player:', e);
    }
  }

  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === PlayerService.STATUS_STORAGE_KEY && event.newValue) {
        try {
          const statusData = JSON.parse(event.newValue);
          const status: PlayerStatus = {
            type: statusData.status || 'stateChange',
            state: statusData.state,
            error: statusData.errorMessage,
            timestamp: statusData.timestamp || Date.now()
          };
          
          console.log('Received player status:', status);
          
          this.lastStatus = status;
          this.statusListeners.forEach(callback => callback(status));

          // Handle player events
          if (status.type === 'ended' || status.type === 'stopped') {
            // Queue next video if needed
            console.log('Video ended or stopped, ready for next video');
          } else if (status.type === 'error') {
            console.error('Player reported error:', status.error);
          } else if (status.type === 'playerClosed') {
            this.handlePlayerClosed();
          }
          
          // Clear the status from localStorage after processing
          localStorage.removeItem(PlayerService.STATUS_STORAGE_KEY);
        } catch (error) {
          console.error('Error parsing player status:', error);
        }
      }
    });
  }

  private setupWindowCloseHandler(): void {
    if (!this.playerWindow) return;

    const checkWindow = () => {
      if (this.playerWindow?.closed) {
        this.handlePlayerClosed();
      } else {
        setTimeout(checkWindow, 1000);
      }
    };

    checkWindow();
  }

  private handlePlayerClosed(): void {
    this.isPlayerOpen = false;
    this.playerWindow = null;
    this.stopStatusChecks();
  }

  private startStatusChecks(): void {
    this.stopStatusChecks();
    this.statusCheckInterval = window.setInterval(() => {
      if (this.playerWindow?.closed) {
        this.handlePlayerClosed();
      }
    }, 1000);
  }

  private stopStatusChecks(): void {
    if (this.statusCheckInterval !== null) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  private focusPlayer(): void {
    if (this.playerWindow && !this.playerWindow.closed) {
      this.playerWindow.focus();
      // Try to bring to front (may not work in all browsers)
      if (this.playerWindow.window) {
        this.playerWindow.window.focus();
      }
    }
  }

  public isPlayerWindowOpen(): boolean {
    return this.isPlayerOpen && !this.playerWindow?.closed;
  }
}

// Export a singleton instance
export const playerService = new PlayerService();

// Add keyboard shortcut (Ctrl+P) to open player
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    playerService.openPlayer();
  }
});
