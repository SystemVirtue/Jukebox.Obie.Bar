interface PlayerCommand {
    action?: 'play' | 'pause' | 'stop' | 'setVolume' | 'seek';
    command?: string;
    videoId?: string;
    title?: string;
    artist?: string;
    volume?: number;
    time?: number;
    timestamp?: number;
}
interface PlayerStatus {
    type: 'stateChange' | 'error' | 'playerClosed';
    state?: YT.PlayerState | string;
    error?: string;
    timestamp: number;
}
export declare class PlayerService {
    private static readonly STORAGE_KEY;
    private playerWindow;
    private statusCheckInterval;
    private isPlayerOpen;
    private lastStatus;
    private statusListeners;
    private readonly playerUrl;
    constructor();
    openPlayer(): void;
    playVideo(videoId: string, title?: string, artist?: string): void;
    pauseVideo(): void;
    stopVideo(): void;
    setVolume(volume: number): void;
    seekTo(time: number): void;
    addStatusListener(callback: (status: PlayerStatus) => void): () => void;
    sendCommand(command: PlayerCommand): void;
    private setupStorageListener;
    private setupWindowCloseHandler;
    private handlePlayerClosed;
    private startStatusChecks;
    private stopStatusChecks;
    private focusPlayer;
    isPlayerWindowOpen(): boolean;
}
export declare const playerService: PlayerService;
export {};
//# sourceMappingURL=PlayerService.d.ts.map