import React, { useState, useEffect, useRef } from 'react';
import { adminService, PlaylistInfo, PlaylistItem } from '../services/AdminService';
import { creditsService } from '../services/CreditsService';
import { playerService } from '../services/PlayerService';
import { coinTestService } from '../services/CoinTestService';
import { EventBus } from '../utils/eventBus';
import { CoinProcessor } from '../hardware';
import './Admin.css';

// Add additional CSS styles for the hardware testing tab
const hardwareStyles = `
.hardware-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hardware-status {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.hardware-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.initialize-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  align-self: flex-start;
}

.initialize-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.coin-simulation {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.port-selection {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.port-selection select {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 1rem;
}

.refresh-ports {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  background-color: #f9f9f9;
  font-family: monospace;
  font-size: 0.85rem;
}

.log-entry {
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: flex-start;
}

.log-time {
  color: #7f8c8d;
  margin-right: 0.5rem;
  white-space: nowrap;
}

.log-level {
  padding: 0.1rem 0.3rem;
  border-radius: 2px;
  margin-right: 0.5rem;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.7rem;
  white-space: nowrap;
}

.log-level.info {
  background-color: #3498db;
  color: white;
}

.log-level.warning {
  background-color: #f39c12;
  color: white;
}

.log-level.error {
  background-color: #e74c3c;
  color: white;
}

.log-level.success {
  background-color: #2ecc71;
  color: white;
}

.log-category {
  color: #8e44ad;
  margin-right: 0.5rem;
  font-weight: bold;
}

.log-message {
  flex: 1;
  overflow-wrap: break-word;
  word-break: break-word;
}

.auto-scroll {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.auto-scroll input {
  margin-right: 0.3rem;
}

.coin-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.coin-button {
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.coin-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dollar-one {
  background-color: #2ecc71;
  color: white;
}

.dollar-two {
  background-color: #f39c12;
  color: white;
}

.coin-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.serial-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
}

.serial-info ul {
  margin-left: 1.5rem;
}

.serial-info li {
  margin-bottom: 0.5rem;
}
`;

// Add styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = hardwareStyles;
  document.head.appendChild(styleElement);
}

interface LogEntry {
  time: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  category: string;
  formattedMessage: string;
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  displayName: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [credits, setCredits] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [playedVideos, setPlayedVideos] = useState(0);
  const [systemUptime, setSystemUptime] = useState('0:00:00');
  const [coinProcessorConnected, setCoinProcessorConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('System ready');
  
  // Playlist management state
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistInfo | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  
  // Export/Import state
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  
  // Log state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  
  // Serial port state
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<SerialPortInfo | null>(null);
  const [isRefreshingPorts, setIsRefreshingPorts] = useState(false);
  
  // Reference to the coinProcessor instance
  const coinProcessorRef = useRef<CoinProcessor | null>(null);

  // Hardware testing methods
  const simulateCoinInsertion = (coinType: 'a' | 'b') => {
    coinTestService.simulateCoinInsertion(coinType);
    // Update local credits state
    setTimeout(() => {
      setCredits(creditsService.getCredits());
    }, 100);
  };

  const handlePortSelection = async (portIndex: number) => {
    if (portIndex < 0 || !availablePorts.length) {
      setSelectedPort(null);
      return;
    }
    
    const port = availablePorts[portIndex];
    setSelectedPort(port);
    
    // Auto-initialize when a port is selected
    try {
      setStatusMessage(`Connecting to ${port.displayName}...`);
      
      if (coinProcessorRef.current) {
        const success = await coinProcessorRef.current.connectToSpecificPort(port);
        setCoinProcessorConnected(success);
        
        if (success) {
          setStatusMessage(`Successfully connected to ${port.displayName}`);
        } else {
          setStatusMessage(`Failed to connect to ${port.displayName}`);
        }
      }
    } catch (error) {
      console.error('Error connecting to port:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const initializeHardwareTest = async () => {
    try {
      setStatusMessage('Connecting to coin acceptor...');
      const success = await creditsService.connectCoinAcceptor();
      setCoinProcessorConnected(success);
      
      if (success) {
        setStatusMessage('Successfully connected to coin acceptor');
        
        // Refresh the available ports after connection
        refreshAvailablePorts();
      } else {
        setStatusMessage('Failed to connect to coin acceptor');
      }
    } catch (error) {
      console.error('Error initializing hardware test:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Initialize admin dashboard
  const refreshAvailablePorts = async () => {
    setIsRefreshingPorts(true);
    setStatusMessage('Refreshing available serial ports...');
    
    try {
      if (coinProcessorRef.current) {
        // Call getAvailablePorts which will trigger the ports-list event
        await coinProcessorRef.current.getAvailablePorts();
      } else {
        setStatusMessage('Coin processor not available');
        setIsRefreshingPorts(false);
      }
    } catch (error) {
      console.error('Error refreshing ports:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setIsRefreshingPorts(false);
    }
  };

  useEffect(() => {
    // Set up subscription to credit changes
    creditsService.onCreditChange(setCredits);
    
    // Set up subscription to system logs
    const eventBus = EventBus.getInstance();
    const logSubscription = eventBus.subscribe('system-log', (logEntry) => {
      setLogs(prevLogs => {
        // Keep only the last 500 logs to prevent memory issues
        const newLogs = [...prevLogs, logEntry];
        if (newLogs.length > 500) {
          return newLogs.slice(newLogs.length - 500);
        }
        return newLogs;
      });
    });
    
    // Set up subscription to ports list
    const portsSubscription = eventBus.subscribe('ports-list', (data) => {
      setAvailablePorts(data.ports);
      setIsRefreshingPorts(false);
    });
    
    // Initialize demo stats
    setActiveUsers(Math.floor(Math.random() * 10) + 1);
    setPlayedVideos(Math.floor(Math.random() * 100) + 10);
    
    // Update system uptime
    const startTime = Date.now();
    const uptimeInterval = setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      setSystemUptime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    // Check connection status
    const connStatus = creditsService.isCoinAcceptorConnected();
    setCoinProcessorConnected(connStatus);
    
    // Initialize coinProcessor reference
    coinProcessorRef.current = creditsService.getCoinProcessor();
    
    // If coin processor is available, load available ports
    if (coinProcessorRef.current) {
      refreshAvailablePorts();
    }
    
    // Clean up
    return () => {
      clearInterval(uptimeInterval);
      eventBus.unsubscribe(logSubscription);
      eventBus.unsubscribe(portsSubscription);
    };
  }, []);

  // Auto-scroll logs when new entries arrive
  useEffect(() => {
    if (autoScroll && logsContainerRef.current && activeTab === 'logs') {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, activeTab]);
  
  // Load OutsideObie playlists
  const loadOutsideObiePlaylists = async () => {
    try {
      setIsLoadingPlaylists(true);
      setStatusMessage('Loading playlists from OutsideObie channel...');
      
      // Clear any previous playlists and errors
      setPlaylists([]);
      setPlaylistItems([]);
      
      // Log the attempt
      const eventBus = EventBus.getInstance();
      eventBus.emit('system-log', {
        time: new Date().toLocaleTimeString('en-CA', { hour12: false }),
        level: 'info',
        message: 'Attempting to load OutsideObie playlists',
        category: 'playlists',
        formattedMessage: 'Attempting to load OutsideObie playlists'
      });
      
      const playlistsData = await adminService.fetchOutsideObiePlaylists();
      
      if (playlistsData && playlistsData.length > 0) {
        setPlaylists(playlistsData);
        
        // Log success
        eventBus.emit('system-log', {
          time: new Date().toLocaleTimeString('en-CA', { hour12: false }),
          level: 'success',
          message: `Successfully loaded ${playlistsData.length} playlists from OutsideObie channel`,
          category: 'playlists',
          formattedMessage: `Successfully loaded ${playlistsData.length} playlists from OutsideObie channel`
        });
        
        setStatusMessage(`Successfully loaded ${playlistsData.length} playlists from OutsideObie channel`);
      } else {
        // Log empty results
        eventBus.emit('system-log', {
          time: new Date().toLocaleTimeString('en-CA', { hour12: false }),
          level: 'warning',
          message: 'No playlists found for OutsideObie channel',
          category: 'playlists',
          formattedMessage: 'No playlists found for OutsideObie channel'
        });
        
        setStatusMessage('No playlists found for OutsideObie channel');
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      
      // Log the error
      const eventBus = EventBus.getInstance();
      eventBus.emit('system-log', {
        time: new Date().toLocaleTimeString('en-CA', { hour12: false }),
        level: 'error',
        message: `Error loading playlists: ${error instanceof Error ? error.message : String(error)}`,
        category: 'playlists',
        formattedMessage: `Error loading playlists: ${error instanceof Error ? error.message : String(error)}`
      });
      
      setStatusMessage(`Error loading playlists: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Load items for a specific playlist
  const loadPlaylistItems = async (playlistId: string) => {
    try {
      setIsLoadingItems(true);
      setPlaylistError(null);
      setSelectedPlaylist(playlistId);
      
      const items = await adminService.fetchPlaylistItems(playlistId);
      setPlaylistItems(items);
      
      const playlist = playlists.find(p => p.id === playlistId);
      setStatusMessage(`Loaded ${items.length} videos from playlist "${playlist?.title}"`);
    } catch (error) {
      console.error('Error loading playlist items:', error);
      setPlaylistError('Failed to load playlist items. Check your API key and network connection.');
      setStatusMessage('Error loading playlist items');
    } finally {
      setIsLoadingItems(false);
    }
  };
  
  // Add credits handler
  const handleAddCredits = (amount: number) => {
    creditsService.addCredits(amount);
    setCredits(creditsService.getCredits());
    setStatusMessage(`Added ${amount} credit${amount !== 1 ? 's' : ''}`);
  };
  
  // Reset credits handler
  const handleResetCredits = () => {
    creditsService.resetCredits();
    setCredits(0);
    setStatusMessage('Credits reset to 0');
  };
  
  // Play video from playlist
  const playVideo = (videoId: string) => {
    playerService.openPlayer();
    
    // Small delay to ensure player window is open
    setTimeout(() => {
      playerService.playVideo(videoId);
      setStatusMessage(`Playing video ${videoId}`);
    }, 1000);
  };
  
  // Export playlist to JSON
  const exportPlaylist = () => {
    if (!selectedPlaylist) {
      setStatusMessage('No playlist selected for export');
      return;
    }
    
    try {
      const jsonData = adminService.exportPlaylistToJson(selectedPlaylist);
      setExportData(jsonData);
      setStatusMessage('Playlist exported to JSON successfully');
    } catch (error) {
      console.error('Error exporting playlist:', error);
      setStatusMessage('Error exporting playlist');
    }
  };
  
  // Import playlist from JSON
  const importPlaylist = () => {
    if (!importData) {
      setStatusMessage('No JSON data to import');
      return;
    }
    
    try {
      adminService.importPlaylistFromJson(importData);
      setStatusMessage('Playlist imported successfully');
      
      // Refresh playlists
      setPlaylists(adminService.getCachedPlaylists());
    } catch (error) {
      console.error('Error importing playlist:', error);
      setStatusMessage('Error importing playlist. Invalid JSON format.');
    }
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
      
      <nav className="admin-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'playlists' ? 'active' : ''} 
          onClick={() => setActiveTab('playlists')}
        >
          Playlists
        </button>
        <button 
          className={activeTab === 'export' ? 'active' : ''} 
          onClick={() => setActiveTab('export')}
        >
          Export/Import
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          System Logs
        </button>
        <button 
          className={activeTab === 'hardware' ? 'active' : ''} 
          onClick={() => setActiveTab('hardware')}
        >
          Hardware Test
        </button>
      </nav>
      
      <div className="admin-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
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
            
            <div className="system-stats">
              <h2>System Statistics</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <h3>Active Users</h3>
                  <div className="stat-value">{activeUsers}</div>
                </div>
                <div className="stat-item">
                  <h3>Videos Played</h3>
                  <div className="stat-value">{playedVideos}</div>
                </div>
                <div className="stat-item">
                  <h3>System Uptime</h3>
                  <div className="stat-value">{systemUptime}</div>
                </div>
              </div>
            </div>
            
            <div className="status-section">
              <h2>System Status</h2>
              <div className="status-message">
                {statusMessage}
              </div>
            </div>
          </div>
        )}
        
        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="playlists-tab">
            <h2>OutsideObie Channel Playlists</h2>
            
            <div className="playlists-controls">
              <button 
                onClick={loadOutsideObiePlaylists} 
                disabled={isLoadingPlaylists}
                className="primary-button"
              >
                {isLoadingPlaylists ? 'Loading...' : 'Load OutsideObie Playlists'}
              </button>
            </div>
            
            {playlistError && (
              <div className="error-message">
                {playlistError}
              </div>
            )}
            
            <div className="playlists-container">
              {playlists.length === 0 && !isLoadingPlaylists ? (
                <div className="empty-state">
                  No playlists loaded. Click the button above to load playlists from OutsideObie channel.
                </div>
              ) : (
                <div className="playlists-grid">
                  {playlists.map(playlist => (
                    <div 
                      key={playlist.id} 
                      className={`playlist-card ${selectedPlaylist === playlist.id ? 'selected' : ''}`}
                      onClick={() => loadPlaylistItems(playlist.id)}
                    >
                      <div className="playlist-thumbnail">
                        <img src={playlist.thumbnailUrl} alt={playlist.title} />
                      </div>
                      <div className="playlist-info">
                        <h3>{playlist.title}</h3>
                        <p>{playlist.itemCount} videos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedPlaylist && (
              <div className="playlist-items">
                <h3>Videos in Playlist</h3>
                
                {isLoadingItems ? (
                  <div className="loading">Loading playlist items...</div>
                ) : playlistItems.length === 0 ? (
                  <div className="empty-state">No videos found in this playlist.</div>
                ) : (
                  <div className="items-grid">
                    {playlistItems.map(item => (
                      <div key={item.videoId} className="item-card">
                        <div className="item-thumbnail">
                          <img src={item.thumbnailUrl} alt={item.title} />
                          <button 
                            className="play-button"
                            onClick={() => playVideo(item.videoId)}
                          >
                            ▶
                          </button>
                        </div>
                        <div className="item-info">
                          <h4>{item.title}</h4>
                          <p>{item.channelTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Export/Import Tab */}
        {activeTab === 'export' && (
          <div className="export-tab">
            <h2>Export/Import Playlists</h2>
            
            <div className="export-section">
              <h3>Export Playlist</h3>
              <div className="export-controls">
                <select 
                  value={selectedPlaylist || ''} 
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  disabled={playlists.length === 0}
                >
                  <option value="">Select a playlist</option>
                  {playlists.map(playlist => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.title}
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={exportPlaylist} 
                  disabled={!selectedPlaylist}
                  className="primary-button"
                >
                  Export to JSON
                </button>
              </div>
              
              {exportData && (
                <div className="json-output">
                  <h4>JSON Data:</h4>
                  <textarea 
                    readOnly
                    value={exportData}
                    rows={10}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(exportData);
                      setStatusMessage('JSON copied to clipboard');
                    }}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
            
            <div className="import-section">
              <h3>Import Playlist</h3>
              <div className="import-controls">
                <textarea 
                  placeholder="Paste JSON playlist data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                />
                
                <button 
                  onClick={importPlaylist} 
                  disabled={!importData}
                  className="primary-button"
                >
                  Import from JSON
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="logs-tab">
            <h2>System Logs</h2>
            <div className="logs-container" ref={logsContainerRef}>
              {logs.length === 0 ? (
                <div className="log-entry">
                  <span className="log-message">No logs available yet</span>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div className="log-entry" key={index}>
                    <span className="log-time">{log.time}</span>
                    <span className={`log-level ${log.level}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="log-category">[{log.category}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="auto-scroll">
              <label>
                <input 
                  type="checkbox" 
                  checked={autoScroll} 
                  onChange={(e) => setAutoScroll(e.target.checked)} 
                />
                Auto-scroll to latest logs
              </label>
              <button 
                onClick={() => setLogs([])} 
                style={{ marginLeft: 'auto' }}
              >
                Clear Logs
              </button>
            </div>
          </div>
        )}
        
        {/* Hardware Testing Tab */}
        {activeTab === 'hardware' && (
          <div className="hardware-tab">
            <h2>Coin Acceptor Hardware Test</h2>
            
            <div className="hardware-status">
              <p>Coin Processor Status: 
                <span className={coinProcessorConnected ? 'connected' : 'disconnected'}>
                  {coinProcessorConnected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
              <p>Current Credits: <span className="credits-value">{credits}</span></p>
              {coinProcessorConnected && selectedPort && (
                <p>Connected Port: <strong>{selectedPort.displayName}</strong></p>
              )}
            </div>
            
            <div className="hardware-controls">
              <div className="port-selection">
                <select 
                  value={availablePorts.findIndex(p => 
                    selectedPort && p.usbVendorId === selectedPort.usbVendorId && 
                    p.usbProductId === selectedPort.usbProductId
                  )}
                  onChange={(e) => handlePortSelection(parseInt(e.target.value))}
                  disabled={isRefreshingPorts || !availablePorts.length}
                >
                  <option value="-1">-- Select Serial Port --</option>
                  {availablePorts.map((port, index) => (
                    <option key={index} value={index}>{port.displayName}</option>
                  ))}
                </select>
                <button 
                  className="refresh-ports" 
                  onClick={refreshAvailablePorts}
                  disabled={isRefreshingPorts}
                >
                  {isRefreshingPorts ? 'Refreshing...' : 'Refresh Ports'}
                </button>
              </div>
              
              <button 
                onClick={initializeHardwareTest} 
                className="initialize-button"
                disabled={coinProcessorConnected}
              >
                Initialize Coin Processor
              </button>
              
              <div className="coin-simulation">
                <h3>Simulate Coin Insertion</h3>
                <div className="coin-buttons">
                  <button 
                    onClick={() => simulateCoinInsertion('a')} 
                    className="coin-button dollar-one"
                    disabled={!coinProcessorConnected}
                  >
                    Insert $1 Coin (a → 1 credit)
                  </button>
                  <button 
                    onClick={() => simulateCoinInsertion('b')} 
                    className="coin-button dollar-two"
                    disabled={!coinProcessorConnected}
                  >
                    Insert $2 Coin (b → 3 credits)
                  </button>
                </div>
              </div>
              
              <div className="serial-info">
                <h3>Serial Communication Info</h3>
                <p>The coin acceptor listens for the following serial commands:</p>
                <ul>
                  <li><strong>'a'</strong> - $1 coin inserted (adds 1 credit)</li>
                  <li><strong>'b'</strong> - $2 coin inserted (adds 3 credits)</li>
                </ul>
                <p>Communication settings: 9600 baud, 8 data bits, 1 stop bit, no parity</p>
              </div>
              
              {logs.filter(log => log.category === 'coin-processor' || log.category === 'credits').length > 0 && (
                <div className="hardware-logs">
                  <h3>Hardware Logs</h3>
                  <div className="logs-container" style={{ maxHeight: '200px' }}>
                    {logs
                      .filter(log => log.category === 'coin-processor' || log.category === 'credits')
                      .slice(-20)
                      .map((log, index) => (
                        <div className="log-entry" key={index}>
                          <span className="log-time">{log.time}</span>
                          <span className={`log-level ${log.level}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="log-message">{log.message}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className="admin-footer">
        <p>YouTube Jukebox Admin Dashboard</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
