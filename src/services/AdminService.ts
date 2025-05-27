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
  private readonly outsideObieChannelId: string = 'UC6QsO0zaIRD8FWUbQiYcQpg'; // OutsideObie channel ID
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
    try {
      console.log('Fetching OutsideObie playlists...');
      
      // Build the URL to fetch playlists
      const url = `${this.baseUrl}/playlists?part=snippet,contentDetails&channelId=${this.outsideObieChannelId}&maxResults=${this.maxResults}&key=${this.apiKey}`;
      
      // Fetch the playlists
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Found ${data.items?.length || 0} playlists from OutsideObie`);
      
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
      
      return playlists;
    } catch (error) {
      console.error('Error fetching OutsideObie playlists:', error);
      throw error;
    }
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
