export declare class UIController {
    private player;
    private playlistManager;
    private queue;
    private coinProcessor;
    private inactivityTimer?;
    private static readonly INACTIVITY_TIMEOUT;
    constructor(playerContainerId: string);
    private initializeUI;
    private setupTouchListeners;
    private setupGridLayout;
    private setupErrorHandling;
    private handleVideoSelection;
    private checkQueue;
    private playRandomBackgroundVideo;
    private startInactivityTimer;
    private resetInactivityTimer;
    private showMessage;
    private setupEventListeners;
    private enterAdminMode;
}
//# sourceMappingURL=uiController.d.ts.map