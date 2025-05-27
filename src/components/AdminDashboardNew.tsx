import React, { useState, useEffect, useRef } from 'react';
import { EventBus } from '../utils/eventBus';
import { useSystemState } from '../hooks/useSystemState';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { LogEntry, useLogs } from '../hooks/useLogs';
import { LogsPanel } from './admin/LogsPanel';
import { HardwareControls } from './admin/HardwareControls';
import { PlaylistManager } from './admin/PlaylistManager';
import { SystemInfo } from './admin/SystemInfo';
import { PlaylistInfo } from '../services/AdminService';
import { SerialPortInfo } from '../types/web-serial';
import './AdminDashboard.css';

// Export types from their source files
export type { LogEntry } from '../hooks/useLogs';
export type { PlaylistInfo } from '../services/AdminService';
export type { SerialPortInfo } from '../types/web-serial';
export type { LogsPanelProps } from './admin/LogsPanel';
export type { HardwareControlsProps } from './admin/HardwareControls';
export type { PlaylistManagerProps } from './admin/PlaylistManager';
export type { SystemInfoProps } from './admin/SystemInfo';

// Main component
const AdminDashboard: React.FC = () => {
  // System state management
  const {
    availablePorts,
    selectedPort,
    isRefreshingPorts,
    isSimulating,
    coinProcessorConnected,
    credits,
    handlePortSelection,
    refreshAvailablePorts,
    toggleSimulation,
    testCoinAcceptor,
    addCredits,
    resetCredits
  } = useSystemState();

  // Playlist management
  const {
    playlists,
    selectedPlaylist,
    playlistVideos,
    selectedVideo,
    loadingPlaylist,
    loadPlaylistVideos,
    handleVideoSelect,
    playNow,
    addToQueue,
    setSelectedPlaylist
  } = usePlaylistManager();

  // Logs management
  const {
    logs,
    addLog,
    clearLogs,
    autoScroll,
    setAutoScroll,
    logsContainerRef
  } = useLogs();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'logs' | 'playlists' | 'hardware'>('logs');
  
  // System info state
  const [systemUptime, setSystemUptime] = useState('00:00:00');
  const [activeUsers, setActiveUsers] = useState(0);
  const [playedVideos, setPlayedVideos] = useState(0);

  // Initialize system info and event listeners
  useEffect(() => {
    // Set up system uptime counter
    const startTime = Date.now();
    const uptimeInterval = setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      setSystemUptime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    // Set up event bus for hardware events
    const eventBus = EventBus.getInstance();
    
    const logSubscription = eventBus.subscribe('hardware-error', (data: any) => {
      try {
        // Handle port list updates
        if ('ports' in data) {
          // This would update availablePorts through the useSystemState hook
          return;
        }
        
        // Handle log entries
        addLog({
          level: 'level' in data && ['info', 'warning', 'error', 'success'].includes(data.level) 
            ? data.level as 'info' | 'warning' | 'error' | 'success'
            : 'info',
          message: data.message || 'No message',
          category: data.source || 'unknown'
        });
      } catch (error) {
        console.error('Error in hardware-error handler:', error);
      }
    });

    // Initialize demo stats
    setActiveUsers(Math.floor(Math.random() * 10) + 1);
    setPlayedVideos(Math.floor(Math.random() * 100) + 10);

    // Cleanup function
    return () => {
      clearInterval(uptimeInterval);
      if (logSubscription) {
        eventBus.unsubscribe(logSubscription);
      }
    };
  }, []);

  // Handle test button press
  const handleTestButtonPress = (button: string) => {
    addLog({
      level: 'info',
      message: `Test button ${button} pressed`,
      category: 'hardware'
    });
    
    if (isSimulating) {
      // Simulate button press
      addLog({
        level: 'success',
        message: `Simulated button ${button} action`,
        category: 'simulation'
      });
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Jukebox Admin Dashboard</h2>
        <div className="system-status">
          <span className={`status-indicator ${coinProcessorConnected ? 'connected' : 'disconnected'}`}>
            {coinProcessorConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="credits">Credits: {credits}</span>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          System Logs
        </button>
        <button 
          className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlist Manager
        </button>
        <button 
          className={`tab ${activeTab === 'hardware' ? 'active' : ''}`}
          onClick={() => setActiveTab('hardware')}
        >
          Hardware Controls
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="main-panel">
          {activeTab === 'logs' && (
            <LogsPanel
              logs={logs}
              autoScroll={autoScroll}
              onClearLogs={clearLogs}
              onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
              containerRef={logsContainerRef}
            />
          )}
          
          {activeTab === 'playlists' && (
            <PlaylistManager
              playlists={playlists}
              selectedPlaylist={selectedPlaylist}
              onPlaylistSelect={setSelectedPlaylist}
              onLoadPlaylist={loadPlaylistVideos}
              onPlayVideo={handleVideoSelect}
              loadingPlaylist={loadingPlaylist}
              playlistVideos={playlistVideos}
              selectedVideo={selectedVideo}
              onPlayNow={playNow}
              onAddToQueue={addToQueue}
            />
          )}
          
          {activeTab === 'hardware' && (
            <HardwareControls
              availablePorts={availablePorts}
              isRefreshingPorts={isRefreshingPorts}
              selectedPort={selectedPort}
              onPortSelect={handlePortSelection}
              onRefreshPorts={refreshAvailablePorts}
              onToggleSimulation={toggleSimulation}
              isSimulating={isSimulating}
              onTestCoinAcceptor={testCoinAcceptor}
              onTestButtonPress={handleTestButtonPress}
              onResetCredits={resetCredits}
              onAddCredits={addCredits}
            />
          )}
        </div>
        
        <div className="sidebar">
          <SystemInfo
            systemUptime={systemUptime}
            activeUsers={activeUsers}
            playedVideos={playedVideos}
            credits={credits}
            coinProcessorConnected={coinProcessorConnected}
            isSimulating={isSimulating}
            onToggleSimulation={toggleSimulation}
          />
          
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="btn-group">
              <button 
                className="btn btn-sm btn-success"
                onClick={() => addCredits(1)}
              >
                Add 1 Credit
              </button>
              <button 
                className="btn btn-sm btn-warning"
                onClick={resetCredits}
              >
                Reset Credits
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => {
                  addLog({
                    level: 'error',
                    message: 'Emergency stop triggered',
                    category: 'system'
                  });
                }}
              >
                Emergency Stop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
