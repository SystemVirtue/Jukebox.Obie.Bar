// Create a simple stub class if the actual implementation can't be found
// This avoids build errors when the real module is missing
class CoinProcessorStub {
  public isConnected: boolean = false;
  constructor() {}
  public async connect(): Promise<boolean> { return false; }
  public addCredits(amount: number): void {}
  public resetCredits(): void {}
  public deductCredits(amount: number): boolean { return false; }
}

// Try to import the real implementation, but use the stub as fallback
let CoinProcessor: any;
try {
  // This is wrapped in a try/catch to prevent build errors
  const importedModule = require('./CoinProcessor');
  CoinProcessor = importedModule.CoinProcessor;
} catch (e) {
  console.warn('Could not load CoinProcessor module, using stub implementation');
  CoinProcessor = CoinProcessorStub;
}

// Export the CoinProcessor
export { CoinProcessor };