import { CoinProcessor, ICoinProcessor } from '../hardware';
import { EventBus } from '../utils/eventBus';

/**
 * Service for managing jukebox credits
 * Handles credit management, coin processing, and payment validation
 */
export class CreditsService {
    private static instance: CreditsService | null = null;
    private coinProcessor: ICoinProcessor;
    private eventBus = EventBus.getInstance();
    private creditChangeCallbacks: ((credits: number) => void)[] = [];
    private creditSettings: {
        dollarOneValue: number;
        dollarTwoValue: number;
        maxCredits: number;
    };

    private constructor() {
        // Initialize coin processor
        this.coinProcessor = new CoinProcessor();
        
        // Set up callback for credit changes
        this.coinProcessor.setOnCreditCallback(this.handleCreditChange.bind(this));
        
        // Load credit settings
        this.creditSettings = this.loadCreditSettings();
        
        // Log initialization
        console.log(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Credits Service initialized with ${this.getCredits()} credits`);
    }

    /**
     * Get the CreditsService singleton instance
     */
    public static getInstance(): CreditsService {
        if (!CreditsService.instance) {
            CreditsService.instance = new CreditsService();
        }
        return CreditsService.instance;
    }

    /**
     * Connect to the coin acceptor device
     */
    public async connectCoinAcceptor(): Promise<boolean> {
        try {
            const result = await this.coinProcessor.connect();
            
            if (result) {
                this.log('Connected to coin acceptor');
                
                // Notify about current credits
                this.handleCreditChange(this.getCredits());
            } else {
                this.log('Failed to connect to coin acceptor', 'error');
            }
            
            return result;
        } catch (error) {
            this.log(`Error connecting to coin acceptor: ${error}`, 'error');
            return false;
        }
    }

    /**
     * Get the current credit balance
     */
    public getCredits(): number {
        return this.coinProcessor.getCredits();
    }

    /**
     * Check if there are enough credits for a transaction
     */
    public hasEnoughCredits(required: number): boolean {
        return this.getCredits() >= required;
    }

    /**
     * Deduct credits for a video selection
     * @returns true if successful, false if insufficient credits
     */
    public deductCredits(amount: number): boolean {
        const success = this.coinProcessor.deductCredits(amount);
        
        if (success) {
            this.log(`Deducted ${amount} credits for video selection`);
            this.eventBus.emit('credits-changed', { 
                total: this.getCredits(),
                change: -amount,
                reason: 'video-selection'
            });
        } else {
            this.log(`Insufficient credits: ${this.getCredits()} < ${amount}`, 'error');
        }
        
        return success;
    }

    /**
     * Calculate credit cost for a video
     * This can be adjusted based on premium content, time of day, etc.
     */
    public getVideoCost(videoId: string, isPremium: boolean = false): number {
        // For now, just use a simple premium/standard price model
        return isPremium ? 3 : 1;
    }

    /**
     * Register a callback for credit changes
     */
    public onCreditChange(callback: (credits: number) => void): void {
        this.creditChangeCallbacks.push(callback);
        
        // Immediately call with current value
        callback(this.getCredits());
    }

    /**
     * Handle credit changes from the coin processor
     */
    private handleCreditChange(credits: number): void {
        // Notify all callbacks
        for (const callback of this.creditChangeCallbacks) {
            callback(credits);
        }
        
        // Emit event for the system
        this.eventBus.emit('credits-changed', { 
            total: credits,
            change: 0, // Not calculating the change here
            reason: 'update'
        });
    }

    /**
     * Load credit settings from localStorage
     */
    private loadCreditSettings(): { dollarOneValue: number; dollarTwoValue: number; maxCredits: number } {
        try {
            const savedSettings = localStorage.getItem('jukebox_credit_settings');
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
        } catch (e) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error loading credit settings:`, e);
        }
        
        // Default values
        return {
            dollarOneValue: 1,
            dollarTwoValue: 3,
            maxCredits: 255
        };
    }

    /**
     * Log a message with timestamp
     */
    private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
        const prefix = level === 'error' ? 'ERROR' : level === 'warning' ? 'WARNING' : 'INFO';
        console.log(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] [${prefix}] Credits: ${message}`);
        
        // For errors, also emit an event
        if (level === 'error') {
            this.eventBus.emit('error', {
                source: 'credits-service',
                error: message
            });
        }
    }
}

// Export a singleton instance
export const creditsService = CreditsService.getInstance();
