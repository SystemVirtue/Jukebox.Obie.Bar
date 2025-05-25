interface CoinMessage {
    header: number[];
    command: number;
    checksum: number;
}
export declare class CoinProcessor {
    private static readonly TIMEOUT;
    private static readonly MAX_CREDITS;
    private currentCredits;
    private onCreditCallback?;
    constructor();
    processCoinMessage(message: CoinMessage): Promise<void>;
    setOnCreditCallback(callback: (credits: number) => void): void;
    private validateMessage;
    private updateCredits;
    getCredits(): number;
}
export {};
//# sourceMappingURL=coinProcessor.d.ts.map