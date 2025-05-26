import React from 'react';
import { createRoot } from 'react-dom/client';
import { SearchContainer } from './components/SearchContainer';
import './components/MainUI.css';

/**
 * YouTube Jukebox Search Kiosk
 * This file serves as the entry point for the dedicated search kiosk at /jukebox
 * It only includes the search functionality and background assets (no video player)
 */

// Create a wrapper component that only implements search
// and passes a no-op function for onSelectVideo to prevent videos from playing in this window
const JukeboxApp: React.FC = () => {
  // This is an intentional no-op function - we don't want videos to play in this window
  const handleSelectVideo = (videoId: string) => {
    console.log('Video selected, but not playing in this window:', videoId);
    // We could automatically open the player window here if desired
    // But for now, we'll rely on the Open Player button in the UI
  };

  return <SearchContainer onSelectVideo={handleSelectVideo} />;
};

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SearchContainer } from './components/SearchContainer';
import './components/MainUI.css';

/**
 * YouTube Jukebox Search Kiosk
 * This file serves as the entry point for the dedicated search kiosk at /jukebox
 * It only includes the search functionality and background assets (no video player)
 */

// Create a wrapper component that only implements search
// and passes a no-op function for onSelectVideo to prevent videos from playing in this window
const JukeboxApp: React.FC = () => {
  // This is an intentional no-op function - we don't want videos to play in this window
  const handleSelectVideo = (videoId: string) => {
    console.log('Video selected, but not playing in this window:', videoId);
    // We could automatically open the player window here if desired
    // But for now, we'll rely on the Open Player button in the UI
  };

  return <SearchContainer onSelectVideo={handleSelectVideo} />;
};

// Mount the application
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('search-root');
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <JukeboxApp />
      </React.StrictMode>
    );
  }
});