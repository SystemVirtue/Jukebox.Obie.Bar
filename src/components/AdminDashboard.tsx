import React, { useState, useEffect } from 'react';
import { adminService, PlaylistInfo, PlaylistItem } from '../services/AdminService';
import { creditsService } from '../services/CreditsService';
import { playerService } from '../services/PlayerService';
import { coinTestService } from '../services/CoinTestService';
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

const AdminDashboard: React.FC = () => {
  // Credits and connection state
  const [credits, setCredits] = useState<number>(0);
  const [coinProcessorConnected, setCoinProcessorConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  
  // System stats
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [playedVideos, setPlayedVideos] = useState<number>(0);
  const [systemUptime, setSystemUptime] = useState<string>('0 days, 0 hours');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Hardware testing state
  const [serialOutput, setSerialOutput] = useState<string[]>([]);
  
  // Playlist state
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  
  // Export/Import state
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  
  // Hardware testing methods
  const simulateCoinInsertion = (coinType: 'a' | 'b') => {
    coinTestService.simulateCoinInsertion(coinType);
    // Update local credits state
    setTimeout(() => {
      setCredits(creditsService.getCredits());
    }, 100);
  };

  const initializeHardwareTest = async () => {
    const result = await coinTestService.initialize();
    setCoinProcessorConnected(result);
    setStatusMessage(result ? 'Hardware test initialized successfully' : 'Hardware test initialization failed');
  };
  
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
    
    // Generate mock system stats
    setActiveUsers(Math.floor(Math.random() * 5) + 1);
    setPlayedVideos(Math.floor(Math.random() * 100) + 50);
    const days = Math.floor(Math.random() * 10);
    const hours = Math.floor(Math.random() * 24);
    setSystemUptime(`${days} days, ${hours} hours`);
    
    return () => {
      document.removeEventListener('credits-changed', handleCreditsChanged as EventListener);
    };
  }, []);
  
  // Load OutsideObie playlists
  const loadOutsideObiePlaylists = async () => {
    try {
      setIsLoadingPlaylists(true);
      setPlaylistError(null);
      
      const playlistsData = await adminService.fetchOutsideObiePlaylists();
      setPlaylists(playlistsData);
      
      setStatusMessage(`Successfully loaded ${playlistsData.length} playlists from OutsideObie channel`);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setPlaylistError('Failed to load playlists. Check your API key and network connection.');
      setStatusMessage('Error loading playlists');
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
            <div className="logs-container">
              <div className="log-entry">
                <span className="log-time">2025-05-27 18:30:15</span>
                <span className="log-level info">INFO</span>
                <span className="log-message">System started</span>
              </div>
              <div className="log-entry">
                <span className="log-time">2025-05-27 18:30:17</span>
                <span className="log-level info">INFO</span>
                <span className="log-message">Coin processor initialized</span>
              </div>
              <div className="log-entry">
                <span className="log-time">2025-05-27 18:35:22</span>
                <span className="log-level info">INFO</span>
                <span className="log-message">Credits updated: 5</span>
              </div>
              <div className="log-entry">
                <span className="log-time">2025-05-27 18:42:10</span>
                <span className="log-level warning">WARN</span>
                <span className="log-message">API rate limit approaching</span>
              </div>
              <div className="log-entry">
                <span className="log-time">2025-05-27 19:01:05</span>
                <span className="log-level info">INFO</span>
                <span className="log-message">Player window opened</span>
              </div>
              <div className="log-entry">
                <span className="log-time">2025-05-27 19:05:22</span>
                <span className="log-level info">INFO</span>
                <span className="log-message">Video playback started: xxxxxxxxxxx</span>
              </div>
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
            </div>
            
            <div className="hardware-controls">
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
