/**
 * YouTube Jukebox Player
 * This file serves as the entry point for the dedicated player window
 * It provides video playback functionality and communicates with the main window
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { SecurityConfig } from './config/security.config.js';
import './components/Player.css';

// Set up Content Security Policy
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = Object.entries(SecurityConfig.csp.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
document.head.appendChild(meta);

// Import types from the existing type definitions
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Player application component
const PlayerApp: React.FC = () => {
  // State for the current video ID and player instance
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playerRef = useRef<any>(null);
  // Use proper typing for useRef with null value, as per memory about TS null safety
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize YouTube API
  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      // Use defensive programming to handle null values, as per the memory about null safety
      const containerElement = playerContainerRef.current;
      if (containerElement) {
        // First create a div inside the container for the player to attach to
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player-element';
        containerElement.appendChild(playerDiv);
        
        // Initialize the player on the newly created div
        playerRef.current = new window.YT.Player('youtube-player-element', {
          height: '100%',
          width: '100%',
          videoId: videoId || '',
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            fs: 1,
            modestbranding: 1,
            color: 'white'
          },
          events: {
            onStateChange: (event: any) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
              
              // Notify main window of state change
              if (window.opener) {
                window.opener.postMessage({
                  source: 'player-window',
                  type: 'stateChange',
                  state: event.data
                }, window.location.origin);
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
            }
          }
        });
      }
    };

    // Handle messages from main window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { source, command, videoId: videoIdFromMessage } = event.data || {};
      
      if (source === 'main-window') {
        console.log(`Player received command: ${command}`, event.data);
        
        if (command === 'play' && videoIdFromMessage && playerRef.current) {
          setVideoId(videoIdFromMessage);
          playerRef.current.loadVideoById(videoIdFromMessage);
        } else if (command === 'pause' && playerRef.current) {
          playerRef.current.pauseVideo();
        } else if (command === 'resume' && playerRef.current) {
          playerRef.current.playVideo();
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Notify main window that player is ready
    if (window.opener) {
      window.opener.postMessage({
        source: 'player-window',
        type: 'playerReady'
      }, window.location.origin);
    }
    
    // Send closing message when window is closed
    window.addEventListener('beforeunload', () => {
      if (window.opener) {
        window.opener.postMessage({
          source: 'player-window',
          type: 'playerClosed'
        }, window.location.origin);
      }
    });
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);
  
  // Play video if ID changes
  useEffect(() => {
    if (videoId && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  return (
    <div className="player-container">
      <div className="video-container">
        <div ref={playerContainerRef} id="youtube-player"></div>
      </div>
      <div className="player-info">
        {videoId ? (
          <div>Now playing: {videoId}</div>
        ) : (
          <div>Ready to play videos</div>
        )}
      </div>
    </div>
  );
};

// Mount the application
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('player-root');
  if (root) {
    createRoot(root).render(
      <PlayerApp />
    );
  }
});
