enum SerialErrors {
    Timeout = 'Timeout',
    Checksum = 'Checksum',
    Overflow = 'Overflow',
    InvalidCode = 'InvalidCode'
}

interface CoinMessage {
    header: number[];
    command: number;
    checksum: number;
}

export class CoinProcessor {
    private static readonly TIMEOUT = 5000; // 5 seconds
    private static readonly MAX_CREDITS = 255;
    private currentCredits: number = 0;
    private onCreditCallback?: (credits: number) => void;

    constructor() {
        // Initialize USB-HID connection here
    }

    async processCoinMessage(message: CoinMessage): Promise<void> {
        try {
            await this.validateMessage(message);
            await this.updateCredits(message.command);
            if (this.onCreditCallback) {
                this.onCreditCallback(this.currentCredits);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] ${error.message}`);
            }
            throw error;
        }
    }

    public setOnCreditCallback(callback: (credits: number) => void): void {
        this.onCreditCallback = callback;
    }

    private async validateMessage(message: CoinMessage): Promise<void> {
        const computedChecksum = message.header
            .concat(message.command)
            .reduce((acc, byte) => acc ^ byte, 0);

        if (message.checksum !== computedChecksum) {
            throw new Error(SerialErrors.Checksum);
        }

        if (message.command !== 0x61 && message.command !== 0x62) { // 'a' and 'b' in ASCII
            throw new Error(SerialErrors.InvalidCode);
        }
    }

    private async updateCredits(command: number): Promise<void> {
        const creditsToAdd = command === 0x62 ? 3 : 1; // 'b' = $2 (3 credits), 'a' = $1 (1 credit)

        if (this.currentCredits + creditsToAdd > CoinProcessor.MAX_CREDITS) {
            throw new Error(SerialErrors.Overflow);
        }

        this.currentCredits += creditsToAdd;
    }

    public getCredits(): number {
        return this.currentCredits;
    }
}
