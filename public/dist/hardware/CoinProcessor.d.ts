declare enum SerialErrors {
    Timeout = "TIMEOUT",
    Checksum = "CHECKSUM",
    Overflow = "OVERFLOW",
    InvalidCode = "INVALID_CODE",
    DeviceNotFound = "DEVICE_NOT_FOUND",
    ConnectionFailed = "CONNECTION_FAILED"
}
type ErrorHandler = (error: SerialErrors, message: string) => void;
export declare class CoinProcessor {
    private static readonly MAX_CREDITS;
    private port;
    private reader;
    private currentCredits;
    private onCreditCallback?;
    private onErrorCallback?;
    isConnected: boolean;
    private isListening;
    private eventBus;
    private _serialCallback?;
    constructor();
    /**
     * Connects to the serial device
     */
    connect(): Promise<boolean>;
    /**
     * Begins listening for incoming serial data
     */
    private startListening;
    /**
     * Process data received from the serial port
     */
    private processSerialData;
    /**
     * Display visual feedback when credits are added
     */
    private showCreditAddedFeedback;
    /**
     * Adds credits to the current balance
     */
    addCredits(amount: number): void;
    /**
     * Resets credits to zero
     */
    resetCredits(): void;
    /**
     * Get information about the serial port
     */
    getPortInfo(): string;
    /**
     * Set callback for serial communication monitoring
     */
    setSerialCallback(callback: (message: string) => void): void;
    /**
     * Deducts credits from the current balance
     * @returns True if deduction successful, false if insufficient credits
     */
    deductCredits(amount: number): boolean;
    /**
     * Saves credits to localStorage
     */
    private saveCredits;
    /**
     * Loads credits from localStorage
     */
    private loadCredits;
    /**
     * Get the current credit balance
     */
    getCredits(): number;
    /**
     * Register a callback for credit changes
     */
    setOnCreditCallback(callback: (credits: number) => void): void;
    /**
     * Register a callback for errors
     */
    setOnErrorCallback(callback: ErrorHandler): void;
    /**
     * Handle and log errors
     */
    private handleError;
    /**
     * Log message with timestamp
     */
    private log;
    /**
     * Disconnect from the serial port
     */
    disconnect(): Promise<void>;
}
export {};
//# sourceMappingURL=CoinProcessor.d.ts.map