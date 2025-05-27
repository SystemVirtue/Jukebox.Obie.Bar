/**
 * Coin Test Service
 * Utility service for testing the coin acceptor functionality
 */

import { creditsService } from './CreditsService';
import { EventBus } from '../utils/eventBus';

export class CoinTestService {
  private static instance: CoinTestService | null = null;
  private eventBus = EventBus.getInstance();
  private connected = false;
  
  private constructor() {
    // Listen for credit change events
    this.eventBus.subscribe('credits-changed', this.handleCreditChange.bind(this));
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CoinTestService {
    if (!CoinTestService.instance) {
      CoinTestService.instance = new CoinTestService();
    }
    return CoinTestService.instance;
  }
  
  /**
   * Initialize connection to coin acceptor
   */
  public async initialize(): Promise<boolean> {
    try {
      this.connected = await creditsService.connectCoinAcceptor();
      console.log(`Coin test service initialized. Connected: ${this.connected}`);
      return this.connected;
    } catch (error) {
      console.error('Failed to initialize coin test service:', error);
      return false;
    }
  }
  
  /**
   * Simulate coin insertion for testing
   */
  public simulateCoinInsertion(coinType: 'a' | 'b'): void {
    console.log(`Simulating coin insertion: ${coinType}`);
    
    // Determine credit amount based on coin type
    const amount = coinType === 'a' ? 1 : 3;
    
    // Add credits through the credits service
    creditsService.addCredits(amount);
    
    // Show visual feedback
    this.showCoinInsertedFeedback(coinType, amount);
  }
  
  /**
   * Show visual feedback for simulated coin
   */
  private showCoinInsertedFeedback(coinType: string, amount: number): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'credit-notification test-mode';
    notification.innerHTML = `
      <strong>TEST MODE</strong><br>
      Simulated ${coinType === 'a' ? '$1' : '$2'} coin<br>
      +${amount} CREDIT${amount > 1 ? 'S' : ''}
    `;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ff9800;
      color: white;
      padding: 16px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 16px;
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
    }, 3000);
  }
  
  /**
   * Handle credit change events
   */
  private handleCreditChange(detail: { total: number; change: number; reason: string }): void {
    const { total, change, reason } = detail;
    console.log(`Credit change detected: ${change} (${reason}). New total: ${total}`);
  }
  
  /**
   * Get current connection status
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Get current credit balance
   */
  public getCredits(): number {
    return creditsService.getCredits();
  }
}

// Export singleton instance
export const coinTestService = CoinTestService.getInstance();
