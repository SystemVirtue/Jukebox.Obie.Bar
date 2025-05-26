/**
 * Service for managing jukebox credits
 * Handles credit management, coin processing, and payment validation
 */
export declare class CreditsService {
    private static instance;
    private coinProcessor;
    private eventBus;
    private creditChangeCallbacks;
    private creditSettings;
    private constructor();
    /**
     * Get the CreditsService singleton instance
     */
    static getInstance(): CreditsService;
    /**
     * Connect to the coin acceptor device
     */
    connectCoinAcceptor(): Promise<boolean>;
    /**
     * Get the current credit balance
     */
    getCredits(): number;
    /**
     * Check if there are enough credits for a transaction
     */
    hasEnoughCredits(required: number): boolean;
    /**
     * Deduct credits for a video selection
     * @returns true if successful, false if insufficient credits
     */
    deductCredits(amount: number): boolean;
    /**
     * Calculate credit cost for a video
     * This can be adjusted based on premium content, time of day, etc.
     */
    getVideoCost(videoId: string, isPremium?: boolean): number;
    /**
     * Register a callback for credit changes
     */
    onCreditChange(callback: (credits: number) => void): void;
    /**
     * Handle credit changes from the coin processor
     */
    private handleCreditChange;
    /**
     * Load credit settings from localStorage
     */
    private loadCreditSettings;
    /**
     * Log a message with timestamp
     */
    private log;
}
export declare const creditsService: CreditsService;
//# sourceMappingURL=CreditsService.d.ts.map