// Player event handler methods extracted from PlayerWindow
import { PlayerStatus, StatusType } from './playerTypes';
import { YouTubePlayer } from './ytPlayer';

export class PlayerEvents {
  constructor(private playerWindow: any) {}

  handlePlayerStateChange(event: any): void {
    const state = event.data;
    if (!this.playerWindow.player) return;
    this.playerWindow.lastPlaybackTime = this.playerWindow.player.getCurrentTime();
    console.log('Player state changed:', state, this.playerWindow.getStateName(state));
    switch (state) {
      case YT.PlayerState.ENDED:
        this.handleVideoEnded();
        break;
      case YT.PlayerState.BUFFERING:
        this.handleBuffering();
        break;
      case YT.PlayerState.PAUSED:
        this.handlePaused();
        break;
      case YT.PlayerState.PLAYING:
        this.handlePlaying();
        break;
      default:
        break;
    }
  }

  handleVideoEnded(): void {
    // Video ended logic
    console.log('Video ended, resetting recovery attempts');
    this.playerWindow.recoveryAttempts = 0;
    this.playerWindow.isRecovering = false;
  }

  handleBuffering(): void {
    // Extended buffering detection
    setTimeout(() => {
      if (this.playerWindow.player?.getPlayerState() === YT.PlayerState.BUFFERING) {
        console.log('Extended buffering detected, attempting recovery');
        this.playerWindow.attemptRecovery('extended_buffering');
      }
    }, 10000); // 10 seconds
  }

  handlePaused(): void {
    // Reset recovery attempts when user explicitly pauses
    if (!this.playerWindow.isRecovering) {
      this.playerWindow.recoveryAttempts = 0;
    }
  }

  handlePlaying(): void {
    // Logic for when video starts playing
    this.playerWindow.isRecovering = false;
  }
}
