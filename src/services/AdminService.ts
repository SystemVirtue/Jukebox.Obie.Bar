/**
 * Admin Service
 * Handles admin-related functionality including YouTube playlist management
 */

import { SearchResult } from './SearchService';

// Interface for playlist data
export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
  isLoaded?: boolean;
}

// Interface for playlist items
export interface PlaylistItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  position: number;
  playlistId: string;
}

export class AdminService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://www.googleapis.com/youtube/v3';
  // Updated channel ID options for OutsideObie
  private readonly outsideObieChannelId: string = 'UCcmCDlPtOv9RsAQM4aSC83A'; // Primary OutsideObie channel ID
  private readonly outsideObieChannelIdBackup: string = 'UC6QsO0zaIRD8FWUbQiYcQpg'; // Backup OutsideObie channel ID
  private readonly maxResults: number = 50; // Max results per API request
  
  // Cache for playlists and items
  private playlists: Map<string, PlaylistInfo> = new Map();
  private playlistItems: Map<string, PlaylistItem[]> = new Map();
  
  constructor(apiKey: string) {
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      throw new Error('YouTube Data API key is required for AdminService');
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch all playlists from OutsideObie channel
   */
  public async fetchOutsideObiePlaylists(): Promise<PlaylistInfo[]> {
    let lastError: Error | null = null;
    const channelIds = [this.outsideObieChannelId, this.outsideObieChannelIdBackup];
    
    // Try both channel IDs in case one is incorrect
    for (const channelId of channelIds) {
      try {
        console.log(`Fetching playlists from channel ID: ${channelId}...`);
        
        // Build the URL to fetch playlists
        const url = `${this.baseUrl}/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=${this.maxResults}&key=${this.apiKey}`;
        
        // Log the URL being used (without the API key for security)
        const sanitizedUrl = url.replace(this.apiKey, 'API_KEY_REDACTED');
        console.log(`Request URL: ${sanitizedUrl}`);
        
        // Fetch the playlists
        const response = await fetch(url);
        const responseText = await response.text(); // Get raw response for debugging
        
        if (!response.ok) {
          console.error(`Failed response for channel ${channelId}:`, responseText);
          throw new Error(`Failed to fetch playlists: ${response.status} ${response.statusText}`);
        }
        
        // Parse the response as JSON
        const data = JSON.parse(responseText);
        console.log(`Found ${data.items?.length || 0} playlists from channel ID: ${channelId}`);
        
        // If no playlists found, try the next channel ID
        if (!data.items || data.items.length === 0) {
          console.warn(`No playlists found for channel ID: ${channelId}, will try backup if available`);
          lastError = new Error(`No playlists found for channel ID: ${channelId}`);
          continue;
        }
        
        // Process the playlists
        const playlists: PlaylistInfo[] = (data.items || []).map((item: any) => {
          const playlist: PlaylistInfo = {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            itemCount: item.contentDetails?.itemCount || 0
          };
          
          // Cache the playlist
          this.playlists.set(playlist.id, playlist);
          
          return playlist;
        });
        
        // If we got playlists, return them
        if (playlists.length > 0) {
          return playlists;
        }
      } catch (error) {
        console.error(`Error fetching playlists from channel ID ${channelId}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    
    // If we get here, all channel IDs failed
    console.error('All channel IDs failed to fetch playlists');
    throw lastError || new Error('Failed to fetch playlists from any channel ID');
  }
  
  /**
   * Fetch items from a specific playlist
   */
  public async fetchPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
    try {
      console.log(`Fetching items for playlist: ${playlistId}`);
      
      // Check if we already have this playlist's items cached
      if (this.playlistItems.has(playlistId)) {
        console.log(`Returning cached items for playlist: ${playlistId}`);
        return this.playlistItems.get(playlistId) || [];
      }
      
      // Build the URL to fetch playlist items
      const url = `${this.baseUrl}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${this.maxResults}&key=${this.apiKey}`;
      
      // Fetch the playlist items
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist items: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Found ${data.items?.length || 0} items in playlist ${playlistId}`);
      
      // Process the playlist items
      const items: PlaylistItem[] = (data.items || [])
        .filter((item: any) => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId)
        .map((item: any) => {
          return {
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            position: item.snippet.position,
            playlistId: playlistId
          };
        });
      
      // Cache the playlist items
      this.playlistItems.set(playlistId, items);
      
      // Mark the playlist as loaded
      const playlist = this.playlists.get(playlistId);
      if (playlist) {
        playlist.isLoaded = true;
        this.playlists.set(playlistId, playlist);
      }
      
      return items;
    } catch (error) {
      console.error(`Error fetching items for playlist ${playlistId}:`, error);
      throw error;
    }
  }
  
  /**
   * Load all playlists and their items (expensive operation)
   */
  public async loadAllPlaylistsWithItems(): Promise<Map<string, PlaylistItem[]>> {
    try {
      // First, fetch all playlists
      const playlists = await this.fetchOutsideObiePlaylists();
      
      // Then, fetch items for each playlist
      const fetchPromises = playlists.map(playlist => 
        this.fetchPlaylistItems(playlist.id)
      );
      
      // Wait for all fetches to complete
      await Promise.all(fetchPromises);
      
      return this.playlistItems;
    } catch (error) {
      console.error('Error loading all playlists with items:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific playlist by ID
   */
  public getPlaylist(playlistId: string): PlaylistInfo | undefined {
    return this.playlists.get(playlistId);
  }
  
  /**
   * Get cached playlists
   */
  public getCachedPlaylists(): PlaylistInfo[] {
    return Array.from(this.playlists.values());
  }
  
  /**
   * Get cached playlist items
   */
  public getCachedPlaylistItems(playlistId: string): PlaylistItem[] {
    return this.playlistItems.get(playlistId) || [];
  }
  
  /**
   * Convert playlist items to search results format
   */
  public convertToSearchResults(items: PlaylistItem[]): SearchResult[] {
    return items.map(item => ({
      videoId: item.videoId,
      title: item.title,
      channelTitle: item.channelTitle,
      thumbnailUrl: item.thumbnailUrl
    }));
  }
  
  /**
   * Export playlist to JSON format for backup
   */
  public exportPlaylistToJson(playlistId: string): string {
    const playlist = this.playlists.get(playlistId);
    const items = this.playlistItems.get(playlistId) || [];
    
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }
    
    const exportData = {
      playlist,
      items
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Import playlist from JSON
   */
  public importPlaylistFromJson(jsonData: string): void {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.playlist || !importData.items) {
        throw new Error('Invalid playlist JSON format');
      }
      
      // Add to cache
      this.playlists.set(importData.playlist.id, importData.playlist);
      this.playlistItems.set(importData.playlist.id, importData.items);
      
    } catch (error) {
      console.error('Error importing playlist from JSON:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const adminService = new AdminService(import.meta.env.VITE_YOUTUBE_API_KEY || '');
