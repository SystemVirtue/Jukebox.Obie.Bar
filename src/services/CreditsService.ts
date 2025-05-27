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
        startupCredits: number;
    };
    private _isCoinAcceptorConnected: boolean = false;

    private constructor() {
        // Initialize coin processor
        this.coinProcessor = new CoinProcessor();
        
        // Set up callback for credit changes
        this.coinProcessor.setOnCreditCallback(this.handleCreditChange.bind(this));
        
        // Load credit settings
        this.creditSettings = this.loadCreditSettings();
        
        // Add startup credits (3) if no credits exist
        if (this.getCredits() === 0) {
            this.addStartupCredits();
        }
        
        // Set up localStorage event listener for cross-tab/window synchronization
        this.setupCreditsSynchronization();
        
        // Log initialization
        this.log(`Credits Service initialized with ${this.getCredits()} credits`, 'info');
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
                this._isCoinAcceptorConnected = true;
                this.log('Connected to coin acceptor', 'success');
                
                // Notify about current credits
                this.handleCreditChange(this.getCredits());
            } else {
                this._isCoinAcceptorConnected = false;
                this.log('Failed to connect to coin acceptor', 'error');
            }
            
            return result;
        } catch (error) {
            this._isCoinAcceptorConnected = false;
            this.log(`Error connecting to coin acceptor: ${error}`, 'error');
            return false;
        }
    }
    
    /**
     * Get the coin processor instance for direct hardware access
     */
    public getCoinProcessor(): CoinProcessor | null {
        return this.coinProcessor instanceof CoinProcessor ? this.coinProcessor : null;
    }
    
    /**
     * Check if the coin acceptor is connected
     */
    public isCoinAcceptorConnected(): boolean {
        return this._isCoinAcceptorConnected;
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
            const newTotal = this.getCredits();
            this.log(`Deducted ${amount} credits for video selection. Remaining: ${newTotal}`);
            
            // Emit event for local listeners
            this.eventBus.emit('credits-changed', { 
                total: newTotal,
                change: -amount,
                reason: 'video-selection'
            });
            
            // Sync across tabs/windows using localStorage
            this.syncCreditsAcrossWindows(newTotal, 'deduct');
        } else {
            this.log(`Insufficient credits: ${this.getCredits()} < ${amount}`, 'error');
        }
        
        return success;
    }

    /**
     * Add credits (for admin or testing purposes)
     * @param amount Number of credits to add
     * @param source Source of the credit addition
     */
    public addCredits(amount: number, source: string = 'admin-panel'): void {
        if (amount <= 0) return;
        
        const currentCredits = this.getCredits();
        this.coinProcessor.addCredits(amount);
        const newTotal = this.getCredits();
        
        this.log(`Added ${amount} credits through ${source}. New total: ${newTotal}`);
        
        // Emit event for local listeners
        this.eventBus.emit('credits-changed', { 
            total: newTotal,
            change: amount,
            reason: source
        });
        
        // Sync across tabs/windows using localStorage
        this.syncCreditsAcrossWindows(newTotal, `add-${source}`);
    }
    
    /**
     * Reset credits to zero (admin function)
     */
    public resetCredits(): void {
        const currentCredits = this.getCredits();
        this.coinProcessor.resetCredits();
        
        this.log(`Reset credits from ${currentCredits} to 0 through admin panel`);
        
        // Emit event for local listeners
        this.eventBus.emit('credits-changed', { 
            total: 0,
            change: -currentCredits,
            reason: 'admin-reset'
        });
        
        // Sync across tabs/windows using localStorage
        this.syncCreditsAcrossWindows(0, 'reset');
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
     * Internal handler for credit changes from the coin processor
     */
    private handleCreditChange(credits: number): void {
        this.notifyCreditsChanged();
    }
    
    /**
     * Notify all registered callbacks about credit changes
     */
    private notifyCreditsChanged(): void {
        const currentCredits = this.getCredits();
        
        // Notify all registered callbacks
        for (const callback of this.creditChangeCallbacks) {
            try {
                callback(currentCredits);
            } catch (error) {
                this.log(`Error in credit change callback: ${error}`, 'error');
            }
        }
        
        // Emit event for the system to enable cross-window/tab sync
        this.eventBus.emit('credits-changed', { 
            total: currentCredits,
            change: 0, // Not calculating the change here
            reason: 'update'
        });
    }

    /**
     * Load credit settings from localStorage
     */
    private loadCreditSettings(): { dollarOneValue: number; dollarTwoValue: number; maxCredits: number; startupCredits: number } {
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
            maxCredits: 255,
            startupCredits: 3
        };
    }

    /**
     * Add startup credits to the system
     */
    private addStartupCredits(): void {
        const startupCredits = this.creditSettings.startupCredits;
        this.coinProcessor.addCredits(startupCredits);
        
        this.log(`Added ${startupCredits} startup credits`, 'success');
        
        // Emit credits-changed event
        this.eventBus.emit('credits-changed', {
            total: startupCredits,
            change: startupCredits,
            reason: 'startup'
        });
        
        // Notify registered callbacks
        this.notifyCreditsChanged();
    }
    
    /**
     * Public method to ensure startup credits are added if credits are 0
     * Can be called from any component to force a check
     */
    public ensureStartupCredits(): void {
        if (this.getCredits() === 0) {
            this.log('Ensuring startup credits are applied');
            this.addStartupCredits();
        } else {
            this.log(`No startup credits needed, current balance: ${this.getCredits()}`);
        }
    }

    /**
     * Setup cross-window credits synchronization using localStorage
     */
    private setupCreditsSynchronization(): void {
        // Listen for storage changes (for cross-tab/window sync)
        window.addEventListener('storage', (event) => {
            if (event.key === 'jukeboxCredits') {
                try {
                    const data = JSON.parse(event.newValue || '{}');
                    if (data.credits !== undefined && data.source) {
                        // Only update if coming from a different source than this instance
                        const currentCredits = this.getCredits();
                        if (currentCredits !== data.credits) {
                            // Force update the coin processor credits
                            this.coinProcessor.resetCredits();
                            this.coinProcessor.addCredits(data.credits);
                            
                            // Notify local listeners but don't trigger another sync
                            this.log(`Credits synchronized from external source (${data.source}): ${data.credits}`);
                            this.eventBus.emit('credits-changed', {
                                total: data.credits,
                                change: data.credits - currentCredits,
                                reason: 'sync'
                            });
                        }
                    }
                } catch (error) {
                    this.log(`Error parsing credits sync data: ${error}`, 'error');
                }
            }
        });
    }

    /**
     * Synchronize credits across windows/tabs using localStorage
     */
    private syncCreditsAcrossWindows(credits: number, source: string): void {
        try {
            localStorage.setItem('jukeboxCredits', JSON.stringify({
                credits,
                source,
                timestamp: Date.now()
            }));
        } catch (error) {
            this.log(`Failed to sync credits across windows: ${error}`, 'error');
        }
    }

    /**
     * Log a message to the console with timestamp and emit a log event
     */
    private log(message: string, level: 'info' | 'error' | 'warning' | 'success' = 'info'): void {
        const timestamp = new Date().toLocaleTimeString('en-CA', { hour12: false });
        const formattedMessage = `[${timestamp}] ${message}`;
        
        // Console logging
        if (level === 'error') {
            console.error(formattedMessage);
        } else if (level === 'warning') {
            console.warn(formattedMessage);
        } else if (level === 'success') {
            console.log(`%c${formattedMessage}`, 'color: green; font-weight: bold');
        } else {
            console.log(formattedMessage);
        }
        
        // Emit log event for the admin panel to catch
        this.eventBus.emit('system-log', {
            time: timestamp,
            level,
            message,
            category: 'credits',
            formattedMessage
        });
    }
}

// Export a singleton instance
export const creditsService = CreditsService.getInstance();
