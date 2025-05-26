import { EventBus } from '../utils/eventBus';

enum SerialErrors {
    Timeout = 'TIMEOUT',
    Checksum = 'CHECKSUM',
    Overflow = 'OVERFLOW',
    InvalidCode = 'INVALID_CODE',
    DeviceNotFound = 'DEVICE_NOT_FOUND',
    ConnectionFailed = 'CONNECTION_FAILED'
}

type ErrorHandler = (error: SerialErrors, message: string) => void;

export class CoinProcessor {
    private static readonly MAX_CREDITS = 255;
    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader | null = null;
    private currentCredits: number = 0;
    private onCreditCallback?: (credits: number) => void;
    private onErrorCallback?: ErrorHandler;
    public isConnected: boolean = false;
    private isListening: boolean = false;
    private eventBus = EventBus.getInstance();
    private _serialCallback?: (message: string) => void;

    constructor() {
        // Load previously stored credits
        this.loadCredits();
        
        // Notify when we're initialized
        console.log(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Coin processor initialized. Current credits: ${this.currentCredits}`);
    }

    /**
     * Connects to the serial device
     */
    public async connect(): Promise<boolean> {
        try {
            if (!navigator.serial) {
                this.handleError(SerialErrors.DeviceNotFound, 'Web Serial API not supported in this browser');
                return false;
            }

            // Request port at 9600 baud as specified
            this.port = await navigator.serial.requestPort();
            await this.port.open({ 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                bufferSize: 255
            });

            this.isConnected = true;
            this.log(`Connected to coin acceptor at port ${this.port.getInfo().usbVendorId || 'unknown'}`);
            
            // Start listening for coin inputs
            this.startListening();
            
            return true;
        } catch (error) {
            this.handleError(
                SerialErrors.ConnectionFailed, 
                `Failed to connect to coin acceptor: ${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * Begins listening for incoming serial data
     */
    private async startListening(): Promise<void> {
        if (!this.port || !this.port.readable || this.isListening) return;

        this.isListening = true;
        this.reader = this.port.readable.getReader();
        
        try {
            while (this.isListening && this.reader) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    // The stream was closed
                    break;
                }
                
                if (value) {
                    // Process the received data
                    this.processSerialData(value);
                }
            }
        } catch (error) {
            this.handleError(
                SerialErrors.ConnectionFailed,
                `Error reading from serial port: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            this.isListening = false;
            this.reader?.releaseLock();
            this.reader = null;
        }
    }

    /**
     * Process data received from the serial port
     */
    private processSerialData(data: Uint8Array): void {
        // Convert the binary data to a string
        const dataString = new TextDecoder().decode(data);
        this.log(`Received data: ${dataString}`);
        
        // Process each character
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charAt(i);
            
            // Check for coin insertion signals as per the spec
            if (char === 'a') {
                // $1 coin = 1 credit
                this.addCredits(1);
                this.showCreditAddedFeedback(1);
            } else if (char === 'b') {
                // $2 coin = 3 credits
                this.addCredits(3);
                this.showCreditAddedFeedback(3);
            }
        }
    }

    /**
     * Display visual feedback when credits are added
     */
    private showCreditAddedFeedback(amount: number): void {
        // Dispatch an event that can be used to show UI feedback
        this.eventBus.emit('credits-added', { amount, total: this.currentCredits });
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'credit-notification';
        notification.textContent = `+${amount} CREDIT${amount > 1 ? 'S' : ''}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 16px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 20px;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s, fadeOut 0.5s 2.5s;
            opacity: 0;
        `;
        
        document.body.appendChild(notification);
        
        // Force a reflow to ensure animation works
        void notification.offsetWidth;
        notification.style.opacity = '1';
        
        // Remove after animation
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2500);
    }

    /**
     * Adds credits to the current balance
     */
    public addCredits(amount: number): void {
        if (amount < 0) return;
        
        const newTotal = Math.min(this.currentCredits + amount, CoinProcessor.MAX_CREDITS);
        this.currentCredits = newTotal;
        this.saveCredits();
        this.log(`Added ${amount} credits. New balance: ${this.currentCredits}`);
        
        // Notify callback if registered
        if (this.onCreditCallback) {
            this.onCreditCallback(this.currentCredits);
        }
    }
    
    /**
     * Resets credits to zero
     */
    public resetCredits(): void {
        const oldCredits = this.currentCredits;
        this.currentCredits = 0;
        this.saveCredits();
        this.log(`Reset credits from ${oldCredits} to 0`);
        
        // Notify callback if registered
        if (this.onCreditCallback) {
            this.onCreditCallback(this.currentCredits);
        }
    }
    
    /**
     * Get information about the serial port
     */
    public getPortInfo(): string {
        if (!this.port) return 'Not connected';
        
        try {
            const info = this.port.getInfo();
            return `VendorID: ${info.usbVendorId || 'unknown'}, ProductID: ${info.usbProductId || 'unknown'}`;
        } catch (e) {
            return 'Error getting port info';
        }
    }
    
    /**
     * Set callback for serial communication monitoring
     */
    public setSerialCallback(callback: (message: string) => void): void {
        this._serialCallback = callback;
    }

    /**
     * Deducts credits from the current balance
     * @returns True if deduction successful, false if insufficient credits
     */
    public deductCredits(amount: number): boolean {
        if (this.currentCredits < amount) {
            this.log(`Insufficient credits: ${this.currentCredits} < ${amount}`);
            return false;
        }
        
        this.currentCredits -= amount;
        this.log(`Deducted ${amount} credits. Remaining: ${this.currentCredits}`);
        this.saveCredits();
        
        // Notify callback if registered
        if (this.onCreditCallback) {
            this.onCreditCallback(this.currentCredits);
        }
        
        return true;
    }

    /**
     * Saves credits to localStorage
     */
    private saveCredits(): void {
        try {
            localStorage.setItem('jukebox_credits', this.currentCredits.toString());
        } catch (e) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error saving credits: ${e}`);
        }
    }

    /**
     * Loads credits from localStorage
     */
    private loadCredits(): void {
        try {
            const savedCredits = localStorage.getItem('jukebox_credits');
            if (savedCredits) {
                this.currentCredits = parseInt(savedCredits, 10);
                
                // Validate that the credits are within range
                if (isNaN(this.currentCredits) || this.currentCredits < 0) {
                    this.currentCredits = 0;
                } else if (this.currentCredits > CoinProcessor.MAX_CREDITS) {
                    this.currentCredits = CoinProcessor.MAX_CREDITS;
                }
            }
        } catch (e) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error loading credits: ${e}`);
            this.currentCredits = 0;
        }
    }

    /**
     * Get the current credit balance
     */
    public getCredits(): number {
        return this.currentCredits;
    }

    /**
     * Register a callback for credit changes
     */
    public setOnCreditCallback(callback: (credits: number) => void): void {
        this.onCreditCallback = callback;
    }

    /**
     * Register a callback for errors
     */
    public setOnErrorCallback(callback: ErrorHandler): void {
        this.onErrorCallback = callback;
    }

    /**
     * Handle and log errors
     */
    private handleError(code: SerialErrors, message: string): void {
        this.log(`Error [${code}]: ${message}`);
        
        if (this.onErrorCallback) {
            this.onErrorCallback(code, message);
        }
        
        // Emit to event bus for wider system notification
        this.eventBus.emit('hardware-error', { 
            source: 'coin-processor',
            code,
            message
        });
    }

    /**
     * Log message with timestamp
     */
    private log(message: string): void {
        console.log(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] [CoinProcessor] ${message}`);
        
        // Also log to serial monitor if callback is set
        if (this._serialCallback) {
            this._serialCallback(message);
        }
        
        // Dispatch to event bus for system-wide logging
        this.eventBus.emit('system-log', {
            source: 'coin-processor',
            message,
            timestamp: new Date().toISOString(),
            level: 'info'
        });
    }

    /**
     * Disconnect from the serial port
     */
    public async disconnect(): Promise<void> {
        try {
            this.isListening = false;
            
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.isConnected = false;
            this.log('Disconnected from coin acceptor');
        } catch (error) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error disconnecting: ${error}`);
        }
    }
}
