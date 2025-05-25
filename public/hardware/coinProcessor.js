var SerialErrors;
(function (SerialErrors) {
    SerialErrors["Timeout"] = "Timeout";
    SerialErrors["Checksum"] = "Checksum";
    SerialErrors["Overflow"] = "Overflow";
    SerialErrors["InvalidCode"] = "InvalidCode";
})(SerialErrors || (SerialErrors = {}));
export class CoinProcessor {
    constructor() {
        this.currentCredits = 0;
        // Initialize USB-HID connection here
    }
    async processCoinMessage(message) {
        try {
            await this.validateMessage(message);
            await this.updateCredits(message.command);
            if (this.onCreditCallback) {
                this.onCreditCallback(this.currentCredits);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] ${error.message}`);
            }
            throw error;
        }
    }
    setOnCreditCallback(callback) {
        this.onCreditCallback = callback;
    }
    async validateMessage(message) {
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
    async updateCredits(command) {
        const creditsToAdd = command === 0x62 ? 3 : 1; // 'b' = $2 (3 credits), 'a' = $1 (1 credit)
        if (this.currentCredits + creditsToAdd > CoinProcessor.MAX_CREDITS) {
            throw new Error(SerialErrors.Overflow);
        }
        this.currentCredits += creditsToAdd;
    }
    getCredits() {
        return this.currentCredits;
    }
}
CoinProcessor.TIMEOUT = 5000; // 5 seconds
CoinProcessor.MAX_CREDITS = 255;
//# sourceMappingURL=coinProcessor.js.map