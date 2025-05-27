import { useState, useEffect } from 'react';
import { SerialPortInfo } from '../types/web-serial';
import { creditsService } from '../services/CreditsService';

export const useSystemState = () => {
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [isRefreshingPorts, setIsRefreshingPorts] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [coinProcessorConnected, setCoinProcessorConnected] = useState(false);
  const [credits, setCredits] = useState(0);
  
  // Initialize system state
  useEffect(() => {
    // Check initial connection status
    setCoinProcessorConnected(creditsService.isCoinAcceptorConnected());
    
    // Set up subscription to credit changes
    const unsubscribeCredits = creditsService.onCreditChange((newCredits) => {
      setCredits(newCredits);
    });
    
    // Initial credits update
    setCredits(creditsService.getCredits());
    
    return () => {
      unsubscribeCredits();
    };
  }, []);
  
  // Toggle simulation mode
  const toggleSimulation = () => {
    const newState = !isSimulating;
    setIsSimulating(newState);
    
    if (newState) {
      // When enabling simulation, ensure we have at least 3 credits
      if (credits < 3) {
        creditsService.addCredits(3 - credits, 'simulation-mode');
      }
    }
  };
  
  // Handle port selection
  const handlePortSelection = async (portIndex: number) => {
    if (portIndex < 0 || !availablePorts.length) {
      setSelectedPort(null);
      return;
    }
    
    const port = availablePorts[portIndex];
    setSelectedPort(port.path || null);
    
    try {
      const connected = await creditsService.connectCoinAcceptor();
      setCoinProcessorConnected(connected);
      
      if (connected) {
        // Ensure we have at least 3 credits when connecting
        if (credits < 3) {
          creditsService.addCredits(3 - credits, 'initial-connection');
        }
      }
    } catch (error) {
      console.error('Error connecting to coin acceptor:', error);
      setCoinProcessorConnected(false);
    }
  };
  
  // Refresh available ports
  const refreshAvailablePorts = async () => {
    setIsRefreshingPorts(true);
    try {
      // This would typically call a method to refresh ports from the hardware service
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      // The actual implementation would update availablePorts here
    } finally {
      setIsRefreshingPorts(false);
    }
  };
  
  // Test coin acceptor
  const testCoinAcceptor = () => {
    if (isSimulating) {
      creditsService.addCredits(1, 'test-credit');
    } else if (coinProcessorConnected) {
      // This would trigger a test pulse on the actual hardware
      console.log('Sending test pulse to coin acceptor');
    }
  };
  
  // Add credits (for testing)
  const addCredits = (amount: number) => {
    creditsService.addCredits(amount, 'admin-add');
  };
  
  // Reset credits
  const resetCredits = () => {
    creditsService.resetCredits();
  };
  
  return {
    // State
    availablePorts,
    selectedPort,
    isRefreshingPorts,
    isSimulating,
    coinProcessorConnected,
    credits,
    
    // Actions
    handlePortSelection,
    refreshAvailablePorts,
    toggleSimulation,
    testCoinAcceptor,
    addCredits,
    resetCredits,
    setCoinProcessorConnected
  };
};
