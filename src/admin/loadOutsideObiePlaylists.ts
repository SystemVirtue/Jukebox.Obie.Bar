import { YouTubeConfig } from '../config/youtube.config';

/**
 * Load all playlists from the @OutsideObie YouTube channel
 * @param apiKey YouTube API key
 * @param logCallback Function to log messages
 * @returns Promise that resolves when playlists are loaded
 */
export async function loadOutsideObiePlaylists(
  apiKey: string, 
  logCallback: (message: string, level: 'info' | 'warning' | 'error') => void
): Promise<void> {
  try {
    // Use the OutsideObie channel ID
    const channelId = 'UCdallW2LCQjcnHrikQd7J7A'; // Corrected @OutsideObie channel ID
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&key=${apiKey}&maxResults=50&channelId=${channelId}`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const playlistsContainer = document.getElementById('saved-playlists');
      if (playlistsContainer) {
        playlistsContainer.innerHTML = '';
        
        data.items.forEach((playlist: any) => {
          const playlistElement = document.createElement('div');
          playlistElement.className = 'playlist-item';
          playlistElement.innerHTML = `
            <h4>${playlist.snippet.title}</h4>
            <p>${playlist.snippet.description || 'No description'}</p>
            <button class="load-playlist" data-id="${playlist.id}">Load</button>
          `;
          
          playlistsContainer.appendChild(playlistElement);
        });
        
        // Add event listeners to load buttons - these will be handled by the calling code
        
        logCallback(`Loaded ${data.items.length} playlists from @OutsideObie channel`, 'info');
      }
    } else {
      const container = document.getElementById('saved-playlists');
      if (container) {
        container.innerHTML = '<div class="no-content">No playlists found for @OutsideObie channel</div>';
      }
      logCallback('No playlists found for @OutsideObie channel', 'warning');
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
    const container = document.getElementById('playlists-container');
    if (container) {
      container.innerHTML = '<div class="error">Error loading playlists from @OutsideObie channel</div>';
    }
    logCallback('Error loading playlists from @OutsideObie channel', 'error');
  }
}
