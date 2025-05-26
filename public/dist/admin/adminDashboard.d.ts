export declare class AdminDashboard {
    private static readonly LOG_RETENTION_DAYS;
    private static readonly LOG_STORAGE_KEY;
    private diagnosticLogs;
    private apiKeyRotationTimer?;
    constructor();
    private setupEventBusListeners;
    private loadStoredLogs;
    private saveLogs;
    private initializeDashboard;
    private setupEventListeners;
    private startApiKeyRotationTimer;
    private getNextKeyRotation;
    private rotateApiKey;
    private changePassword;
    private clearLogs;
    private exportLogs;
    private emergencyStop;
    private resetSystem;
    private updateLogViewer;
    private log;
}
//# sourceMappingURL=adminDashboard.d.ts.map