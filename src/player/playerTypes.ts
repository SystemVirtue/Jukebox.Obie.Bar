// Centralized types for PlayerWindow and related modules

export interface PlayerCommand {
  action: 'play' | 'pause' | 'stop' | 'setVolume' | 'seek' | 'load';
  videoId?: string;
  title?: string;
  artist?: string;
  volume?: number;
  time?: number;
  startSeconds?: number;
}

export type StatusType =
  | 'ready'
  | 'error'
  | 'stateChange'
  | 'videoLoaded'
  | 'volumeChanged'
  | 'muteChanged'
  | 'closed';

export interface PlayerStatusBase {
  state?: number; // Using number to match YT.PlayerState
  videoId?: string;
  title?: string;
  artist?: string;
  volume?: number;
  isMuted?: boolean;
  message?: string;
  timestamp?: number;
  currentTime?: number;
  duration?: number;
}

export interface PlayerStatus extends PlayerStatusBase {
  type: StatusType;
}
