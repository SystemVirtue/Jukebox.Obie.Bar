/**
 * Main entry point for the YouTube Jukebox application
 * This replaces the static index.html implementation
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SearchContainer } from './components/SearchContainer.js';
import { playerService } from './services/PlayerService.js';
import { SecurityConfig } from './config/security.config.js';
import './components/MainUI.css';

// Set up Content Security Policy
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = Object.entries(SecurityConfig.csp.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
document.head.appendChild(meta);

// Main application component
const App = () => {
  // Open player window handler
  const handleOpenPlayer = () => {
    playerService.openPlayer();
  };

  // Handle video selection
  const handleSelectVideo = (videoId: string) => {
    playerService.playVideo(videoId);
  };

  return (
    <div className="main-ui-background">
      {/* Media background elements */}
      <img src="/assets/Obie_NEON2.png" className="neon-bg" alt="Neon BG" />
      <img src="/assets/Obie_NEON1.png" className="neon-fg" alt="Neon FG" />
      
      {/* Shield Crest Animation */}
      <video className="shield-crest-video" autoPlay loop muted playsInline>
        <source src="/assets/Obie_Shield_Crest_Animation2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Main search container */}
      <SearchContainer onSelectVideo={handleSelectVideo} />
      
      {/* Player control button */}
      <button 
        id="player-control"
        onClick={handleOpenPlayer}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#ff0000',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Open Player Window
      </button>
    </div>
  );
};

// Mount the application
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <App />
    );
  }
});
