import React, { useState, useRef, useEffect } from 'react';
import { SearchButton } from './SearchButton';
import { VirtualKeyboard } from './VirtualKeyboard';
import { SearchResults } from './SearchResults';
import { searchService, SearchResult } from '../services/SearchService';
import { creditsService } from '../services/CreditsService';
import { playerService } from '../services/PlayerService';
import { SecurityConfig } from '../config/security.config';
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
  // Neon animation effect
  useEffect(() => {
    let running = true;
    let timeout: NodeJS.Timeout;

    const animate = () => {
      if (!running) return;
      const holdTime = Math.random() * 6 + 6; // 6 to 12 sec
      const fadeInTime = Math.random() * 2.5 + 0.5; // 0.5 to 3.0 sec
      const fadeOutTime = Math.random() * 2.5 + 0.5; // 0.5 to 3.0 sec
      const maxOpacity = Math.random() * 0.4 + 0.6; // 0.6 to 1.0

      setNeonTransition(`opacity ${fadeInTime}s linear`);
      setNeonOpacity(0);
      setTimeout(() => {
        setNeonTransition(`opacity ${fadeInTime}s linear`);
        setNeonOpacity(maxOpacity);
        setTimeout(() => {
          setNeonTransition(`opacity ${fadeOutTime}s linear`);
          setNeonOpacity(0);
          timeout = setTimeout(animate, holdTime * 1000);
        }, fadeInTime * 1000);
      }, holdTime * 1000);
    };

    animate();
    return () => {
      running = false;
      clearTimeout(timeout);
    };
  }, []);

  const handleSearchClick = () => {
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
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
    if (!query.trim()) return;
    
    // Special case for admin access
    if (query.trim().toUpperCase() === 'ADMIN') {
      openAdminDashboard();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchService.searchMusicVideos(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for videos. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
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
    <div className="main-ui-background">
      {/* Neon background and foreground */}
      <img src="/assets/Obie_NEON2.png" className="neon-bg" alt="Neon BG" />
      <img src="/assets/Obie_NEON1.png" className="neon-fg" alt="Neon FG" style={{ opacity: neonOpacity, transition: neonTransition }} />
      {/* Shield Crest Animation 2 */}
      <video className="shield-crest-video" autoPlay loop muted playsInline>
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
        <div className="search-interface">
          <VirtualKeyboard 
            onSearch={handleSearch}
            onClose={handleCloseSearch}
          />
          {(searchResults.length > 0 || isLoading || error) && !showAdminOverlay && !showConfirmation && (
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
