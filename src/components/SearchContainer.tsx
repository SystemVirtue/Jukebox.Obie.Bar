import React, { useState, useRef, useEffect } from 'react';
import { SearchButton } from './SearchButton.js';
import { VirtualKeyboard } from './VirtualKeyboard.js';
import { SearchResults } from './SearchResults.js';
import { searchService, SearchResult } from '../services/SearchService.js';
import { creditsService } from '../services/CreditsService.js';
import { playerService } from '../services/PlayerService.js';
import { SecurityConfig } from '../config/security.config.js';
import './SearchContainer.css';
import './MainUI.css';

interface SearchContainerProps {
  onSelectVideo: (videoId: string) => void;
}

export const SearchContainer = ({ onSelectVideo }: SearchContainerProps) => {
  // State for UI
  // UI State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  
  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [filterThreshold, setFilterThreshold] = useState<number>(25); // Default threshold
  
  // Admin & Credits State
  const [showAdminOverlay, setShowAdminOverlay] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [creditsRequired, setCreditsRequired] = useState<number>(1);
  const [insufficientCredits, setInsufficientCredits] = useState<boolean>(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const adminIframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Neon animation state
  const [neonOpacity, setNeonOpacity] = useState<number>(0);
  const [neonTransition, setNeonTransition] = useState<string>('opacity 1.5s linear');
  // Initialize filter threshold from localStorage
  useEffect(() => {
    try {
      // Check if filterThreshold exists in localStorage
      const storedThreshold = localStorage.getItem('filterThreshold');
      console.log('DEBUG - Initial localStorage filterThreshold:', storedThreshold);
      
      if (storedThreshold !== null) {
        const parsedThreshold = parseInt(storedThreshold, 10);
        console.log('DEBUG - Setting threshold state to:', parsedThreshold);
        setFilterThreshold(parsedThreshold);
      } else {
        // Initialize with default if it doesn't exist
        console.log('DEBUG - No threshold in localStorage, initializing with default:', filterThreshold);
        localStorage.setItem('filterThreshold', String(filterThreshold));
      }
      
      // Verify the setting worked
      console.log('DEBUG - Final localStorage filterThreshold:', localStorage.getItem('filterThreshold'));
    } catch (e) {
      console.error('Error accessing localStorage for filter threshold:', e);
    }
  }, []);
  
  // State to control which animation is showing
  const [showNeon, setShowNeon] = useState<boolean>(true);
  // State to control video playback direction
  const [playingForward, setPlayingForward] = useState<boolean>(true);
  // Reference to the shield crest video element
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Shield crest video playback control - bounce effect
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (!videoElement) return;
      
      // If playing forward and reached near the end
      if (playingForward && videoElement.currentTime >= videoElement.duration - 0.1) {
        // Switch to reverse playback
        videoElement.pause();
        setPlayingForward(false);
        // Start playing backward
        const playBackward = () => {
          if (!videoElement) return;
          videoElement.currentTime -= 0.1;
          if (videoElement.currentTime <= 0.1) {
            // Reached the beginning, switch back to forward
            setPlayingForward(true);
            videoElement.play();
            return;
          }
          requestAnimationFrame(playBackward);
        };
        requestAnimationFrame(playBackward);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [playingForward]);

  // Combined animation effect - alternates between neon and shield crest
  useEffect(() => {
    let running = true;
    let timeout: NodeJS.Timeout;

    const animate = () => {
      if (!running) return;
      
      // Toggle between showing neon and shield crest
      setShowNeon(prevShow => {
        // Log the transition for debugging
        console.log('Animation switch: changing from', prevShow ? 'neon' : 'shield crest', 'to', !prevShow ? 'neon' : 'shield crest');
        return !prevShow;
      });
      
      // Toggle between first and second neon regardless of which is showing
      // This ensures neon is ready when we switch back to it
      setNeonOpacity(prevOpacity => {
        return prevOpacity === 0 ? 1 : 0;
      });
      
      // Schedule next animation (every 20 seconds as requested)
      timeout = setTimeout(animate, 20000);
    };

    // Start animation immediately
    animate();
    
    return () => {
      running = false;
      if (timeout) clearTimeout(timeout);
    };
  }, []); // Remove dependency on showNeon to prevent infinite loop

  const handleSearchClick = () => {
    // Set UI state to open the search dialog
    console.log('Search button clicked - opening search dialog');
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    
    // Focus the search input when it appears (in the next render cycle)
    setTimeout(() => {
      // Use a safe access pattern with defensive null checking
      if (inputRef.current) {
        inputRef.current.focus();
        console.log('Search input focused');
      } else {
        console.warn('Could not focus search input - element not found');
      }
    }, 100);
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  // Monitor credit changes
  useEffect(() => {
    const handleCreditsChanged = (event: CustomEvent) => {
      const credits = event.detail?.credits || 0;
      setAvailableCredits(credits);
    };

    // Add event listener for credit changes
    document.addEventListener('credits-changed', handleCreditsChanged as EventListener);

    // Setup keyboard shortcut (Ctrl+P) for opening player
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+P combination (80 is keyCode for 'P')
      if (event.ctrlKey && event.keyCode === 80) {
        event.preventDefault(); // Prevent default browser print dialog
        handleOpenPlayer();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    // Get initial credit value
    setAvailableCredits(creditsService.getCredits());

    return () => {
      document.removeEventListener('credits-changed', handleCreditsChanged as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add effect to handle messages from admin iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      const { source, command } = event.data || {};
      
      if (source === 'admin-dashboard') {
        // Handle commands from admin dashboard
        console.log(`Received command from admin dashboard: ${command}`);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Connect to coin acceptor when component mounts
  useEffect(() => {
    const connectCoinAcceptor = async () => {
      try {
        await creditsService.connectCoinAcceptor();
      } catch (err) {
        console.error('Failed to connect to coin acceptor:', err);
      }
    };
    
    connectCoinAcceptor();
  }, []);

  const handleSearch = async (query: string) => {
    // DIRECT DEBUG TEST
    console.log('%c DIRECT DEBUG TEST - Search triggered with query: ' + query, 'background:red; color:white; font-size:16px;');
    
    if (!query.trim()) return;
    
    // Special case for admin access
    if (query.trim().toUpperCase() === 'ADMIN') {
      openAdminDashboard();
      return;
    }
    
    const performSearch = async (query: string) => {
      setSearchQuery(query);
      setIsLoading(true);
      setError(null);
      
      try {
        // Verify filter threshold from localStorage before search
        const threshold = localStorage.getItem('filterThreshold');
        console.log('%c Current filter threshold before search: ' + threshold, 'background:blue; color:white; font-size:14px');
        
        console.log('%c SearchContainer - Starting search for query: %s', 'background: #222; color: #bada55', query);
        console.time('Search execution time');
        
        // Make sure filter threshold is set before searching
        if (!threshold) {
          localStorage.setItem('filterThreshold', String(filterThreshold));
          console.log('%c Set default filter threshold: ' + filterThreshold, 'background:blue; color:white; font-size:14px');
        }
        
        const results = await searchService.searchMusicVideos(query);
        
        console.timeEnd('Search execution time');
        console.log('%c SearchContainer - Received search results: %d', 'background: #222; color: #bada55', results.length);
        
        // Detailed logging of each result for debugging
        console.group('Search Results Details');
        results.forEach((result, index) => {
          console.log(
            `%c Result #${index + 1}: ${result.title}`, 
            'color: #4CAF50; font-weight: bold',
            '\nChannel:', result.channelTitle,
            '\nVideo ID:', result.videoId,
            '\nOfficialScore:', result.officialScore || 'N/A'
          );
        });
        console.groupEnd();
        
        setSearchResults(results);
      } catch (err) {
        console.error('%c Search error:', 'background: #FF5722; color: white', err);
        setError('Failed to search for videos. Please try again.');
      } finally {
        setIsLoading(false);
        console.log('%c Search process completed', 'background: #222; color: #bada55');
      }
    };
    
    performSearch(query);
  };
  
  const openAdminDashboard = () => {
    setShowAdminOverlay(true);
    setSearchResults([]);
    
    // Load admin dashboard in iframe
    if (adminIframeRef.current) {
      adminIframeRef.current.src = '/admin/index.html';
    }
  };
  
  const closeAdminDashboard = () => {
    setShowAdminOverlay(false);
    
    // Clear iframe source
    if (adminIframeRef.current) {
      adminIframeRef.current.src = 'about:blank';
    }
  };

  const handleVideoSelect = (videoId: string) => {
    console.log('%c Video selected: %s', 'background: #3F51B5; color: white', videoId);
    
    const currentCredits = creditsService.getCredits();
    console.log('%c Current credits: %d', 'background: #FF9800; color: black', currentCredits);
    
    // Store the selected video and show confirmation
    setSelectedVideo(videoId);
    setShowConfirmation(true);
    
    // Determine if this is a premium video (demo implementation)
    const isPremiumVideo = Math.random() < 0.3;
    
    // Calculate required credits using the credits service
    const requiredCredits = creditsService.getVideoCost(videoId, isPremiumVideo);
    setCreditsRequired(requiredCredits);
    
    // Check if user has enough credits
    setInsufficientCredits(!creditsService.hasEnoughCredits(requiredCredits));
  };
  
  const confirmVideoSelection = () => {
    if (selectedVideo) {
      // Attempt to deduct credits
      const success = creditsService.deductCredits(creditsRequired);
      
      if (success) {
        console.log('%c Playing video and deducting credit', 'background: #4CAF50; color: white');
        // Instead of playing the video in this window, open the player window
        playerService.openPlayer();
        // Send the selected video to the player window
        playerService.sendCommand({
          command: 'play',
          videoId: selectedVideo
        });
        
        // Reset state
        setSelectedVideo(null);
        setShowConfirmation(false);
        handleCloseSearch();
      } else {
        // If not enough credits, show error
        setInsufficientCredits(true);
      }
    }
  };
  
  const cancelVideoSelection = () => {
    setSelectedVideo(null);
    setShowConfirmation(false);
    setInsufficientCredits(false);
  };

  const handleOpenPlayer = () => {
    playerService.openPlayer();
  };

  return (
    <div className={`main-ui-background ${showNeon ? 'neon-active' : 'crest-active'}`}>
      {/* Neon background and foreground */}
      <img src="/assets/Obie_NEON2.png" className="neon-bg" alt="Neon BG" />
      <img src="/assets/Obie_NEON1.png" className="neon-fg" alt="Neon FG" style={{ opacity: neonOpacity, transition: neonTransition }} />
      {/* Shield Crest Animation 2 with bounce effect */}
      <video 
        ref={videoRef} 
        className="shield-crest-video" 
        autoPlay 
        muted 
        playsInline
        style={{ 
          opacity: showNeon ? 0 : 1, 
          transition: 'opacity 3s ease-in-out'
        }}
      >
        <source src="/assets/Obie_Shield_Crest_Animation2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Shield spinner for loading */}
      {isLoading && (
        <div className="shield-spinner">
          <img src="/assets/Obie_Shield_BOUNCING_.gif" alt="Loading..." />
        </div>
      )}
      <div className="search-container">
      {/* Credits display - positioned at top right */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px', zIndex: 1000, color: 'white' }}>
        {availableCredits > 0 ? (
          <div style={{ fontSize: '14px' }}>
            Credit Balance: {availableCredits}
          </div>
        ) : (
          <div style={{ fontSize: '14px' }}>
            Insert a coin to add credits
          </div>
        )}
      </div>
      <div className="credits-display">
        <span className="credits-label">Credits:</span>
        <span className="credits-value">{availableCredits}</span>
        <button 
          className="open-player-button" 
          onClick={handleOpenPlayer} 
          title="Open Player (Ctrl+P)"
        >
          <span className="player-icon">▶</span> Open Player
        </button>
      </div>
      {!isSearching ? (
        <SearchButton onClick={handleSearchClick} />
      ) : (
        <div className="search-interface" style={{ position: 'relative', zIndex: 2000 }}>
          {/* Show keyboard only if no search results are displayed yet */}
          {!searchQuery.trim() && (
            <VirtualKeyboard 
              onSearch={handleSearch}
              onClose={handleCloseSearch}
              inputRef={inputRef}
            />
          )}
          
          {/* Show Back to Search button when search results are displayed */}
          {searchQuery.trim() !== '' && !isLoading && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '10px', 
              marginBottom: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ color: 'white', fontSize: '18px', marginRight: '20px' }}>
                  Search: "{searchQuery}"
                </div>
                {/* Credit balance display */}
                <div style={{ 
                  color: 'white', 
                  fontSize: '14px', 
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: '5px 10px',
                  borderRadius: '4px'
                }}>
                  {availableCredits > 0 ? (
                    <>Credit Balance: {availableCredits}</>
                  ) : (
                    <>Insert a coin to add credits</>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={{
                  backgroundColor: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 15px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #111, 0 5px 5px rgba(0, 0, 0, 0.5)',
                  position: 'relative',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.1s ease'
                }}
              >
                Back to Search
              </button>
            </div>
          )}
          
          {/* Only show search results if a search has been attempted or is in progress */}
          {(searchQuery.trim() !== '' || isLoading) && (
            <SearchResults 
              results={searchResults}
              onSelect={handleVideoSelect}
              isLoading={isLoading}
              error={error}
            />
          )}
          
          {/* Admin Dashboard Overlay */}
          {showAdminOverlay && (
            <div className="admin-overlay">
              <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <button className="close-admin-btn" onClick={closeAdminDashboard}>×</button>
              </div>
              <iframe 
                ref={adminIframeRef}
                className="admin-iframe"
                title="Admin Dashboard"
                src="/admin/index.html"
              />
            </div>
          )}
          
          {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className="confirmation-dialog">
              <div className="confirmation-content">
                <h3>Add Video to Queue?</h3>
                <p>This will use {creditsRequired} credit{creditsRequired > 1 ? 's' : ''}.</p>
                <p className="credit-info">Your current balance: {availableCredits} credit{availableCredits !== 1 ? 's' : ''}</p>
                
                {insufficientCredits ? (
                  <div className="error-message">
                    <p>Insufficient credits.</p>
                    <p>Please insert coins to continue.</p>
                  </div>
                ) : null}
                
                <div className="confirmation-buttons">
                  <button 
                    onClick={confirmVideoSelection}
                    disabled={insufficientCredits}
                    className={insufficientCredits ? 'disabled' : ''}
                  >
                    Yes, Play It
                  </button>
                  <button onClick={cancelVideoSelection}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
