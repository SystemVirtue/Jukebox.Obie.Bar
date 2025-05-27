/**
 * YouTube Jukebox Admin Dashboard
 * This file serves as the entry point for the admin dashboard
 * It provides controls for managing credits and system configuration
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SecurityConfig } from './config/security.config.js';
import { creditsService } from './services/CreditsService.js';
import './components/Admin.css';

// Set up Content Security Policy
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = Object.entries(SecurityConfig.csp.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
document.head.appendChild(meta);

// Admin Dashboard application component
const AdminApp: React.FC = () => {
  // State for credits and connection status
  const [credits, setCredits] = useState<number>(0);
  const [coinProcessorConnected, setCoinProcessorConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  
  // State for system stats
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [playedVideos, setPlayedVideos] = useState<number>(0);
  const [systemUptime, setSystemUptime] = useState<string>('0 days, 0 hours');
  
  // State for active tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // State for logs
  const [systemLogs, setSystemLogs] = useState<Array<{time: string, level: string, message: string}>>([]);
  const [filteredLogs, setFilteredLogs] = useState<Array<{time: string, level: string, message: string}>>([]);
  
  // Initialize admin dashboard
  useEffect(() => {
    // Try to connect to the coin processor
    const connectCoinProcessor = async () => {
      try {
        const connected = await creditsService.connectCoinAcceptor();
        setCoinProcessorConnected(connected);
        
        if (connected) {
          setStatusMessage('Coin processor connected successfully!');
        } else {
          setStatusMessage('Running in simulation mode (no hardware detected)');
        }
        
        // Get initial credits
        const currentCredits = creditsService.getCredits();
        setCredits(currentCredits);
      } catch (error) {
        console.error('Failed to connect to coin processor:', error);
        setStatusMessage('Error connecting to coin processor');
      }
    };
    
    connectCoinProcessor();
    
    // Set up credits change listener
    const handleCreditsChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.credits === 'number') {
        setCredits(customEvent.detail.credits);
      }
    };
    
    document.addEventListener('credits-changed', handleCreditsChanged as EventListener);
    
    return () => {
      document.removeEventListener('credits-changed', handleCreditsChanged as EventListener);
    };
  }, []);
  
  // Add credits handler
  const handleAddCredits = (amount: number) => {
    creditsService.addCredits(amount);
    setCredits(creditsService.getCredits());
  };
  
  // Reset credits handler
  const handleResetCredits = () => {
    creditsService.resetCredits();
    setCredits(0);
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Jukebox Admin Dashboard</h1>
        <div className="connection-status">
          Status: <span className={coinProcessorConnected ? 'connected' : 'disconnected'}>
            {coinProcessorConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>
      
      <div className="admin-content">
        <div className="credits-section">
          <h2>Credits Management</h2>
          <div className="credits-display">
            <span>Current Credits:</span>
            <span className="credits-value">{credits}</span>
          </div>
          
          <div className="credits-controls">
            <button onClick={() => handleAddCredits(1)}>Add 1 Credit</button>
            <button onClick={() => handleAddCredits(5)}>Add 5 Credits</button>
            <button onClick={() => handleAddCredits(10)}>Add 10 Credits</button>
            <button onClick={handleResetCredits} className="reset-button">Reset Credits</button>
          </div>
        </div>
        
        <div className="status-section">
          <h2>System Status</h2>
          <div className="status-message">
            {statusMessage}
          </div>
        </div>
      </div>
      
      <footer className="admin-footer">
        <p>YouTube Jukebox Admin Dashboard</p>
      </footer>
    </div>
  );
};

// Mount the application
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('admin-root');
  if (root) {
    createRoot(root).render(
      <AdminApp />
    );
  }
});
