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
  // Use channel username which is more reliable than channel ID
  private readonly outsideObieUsername: string = 'outsideobie2113'; // OutsideObie channel username
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
      console.log(`Fetching playlists for channel username: @${this.outsideObieUsername}...`);
      
      // First, get the channel ID from the username
      const channelInfoUrl = `${this.baseUrl}/channels?part=snippet,contentDetails&forUsername=${this.outsideObieUsername}&key=${this.apiKey}`;
      
      // Also try with the handle (newer YouTube approach)
      const channelByHandleUrl = `${this.baseUrl}/search?part=snippet&type=channel&q=${this.outsideObieUsername}&maxResults=1&key=${this.apiKey}`;
      
      // First try getting the channel by username
      console.log('Trying to get channel by username...');
      let channelId = await this.getChannelIdByUsername();
      
      // If that fails, try searching for the channel
      if (!channelId) {
        console.log('Username lookup failed, searching for channel instead...');
        channelId = await this.getChannelIdBySearch();
      }
      
      // If we still don't have a channel ID, try a direct public playlist search
      if (!channelId) {
        console.log('Channel lookup failed, trying direct playlist search...');
        return await this.getPlaylistsByDirectSearch();
      }
      
      console.log(`Found channel ID: ${channelId}, fetching playlists...`);
      
      // Now that we have the channel ID, get the playlists
      const playlistsUrl = `${this.baseUrl}/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=${this.maxResults}&key=${this.apiKey}`;
      
      // Log the URL being used (without the API key for security)
      const sanitizedUrl = playlistsUrl.replace(this.apiKey, 'API_KEY_REDACTED');
      console.log(`Request URL: ${sanitizedUrl}`);
      
      // Fetch the playlists
      const response = await fetch(playlistsUrl);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Failed response for channel playlists:`, responseText);
        throw new Error(`Failed to fetch playlists: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Found ${data.items?.length || 0} playlists from channel`);
      
      // If no playlists found, try direct search as fallback
      if (!data.items || data.items.length === 0) {
        console.warn('No playlists found via channel ID, trying direct search...');
        return await this.getPlaylistsByDirectSearch();
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
      
      return playlists;
    } catch (error) {
      console.error('Error fetching OutsideObie playlists:', error);
      throw error;
    }
  }
  
  /**
   * Get channel ID by username
   */
  private async getChannelIdByUsername(): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/channels?part=id&forUsername=${this.outsideObieUsername}&key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting channel ID by username:', error);
      return null;
    }
  }
  
  /**
   * Get channel ID by search
   */
  private async getChannelIdBySearch(): Promise<string | null> {
    try {
      // Search for the channel
      const url = `${this.baseUrl}/search?part=snippet&type=channel&q=${this.outsideObieUsername}&maxResults=1&key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.channelId;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting channel ID by search:', error);
      return null;
    }
  }
  
  /**
   * Get playlists by direct search
   */
  private async getPlaylistsByDirectSearch(): Promise<PlaylistInfo[]> {
    try {
      // Search for playlists directly
      const url = `${this.baseUrl}/search?part=snippet&type=playlist&q=${this.outsideObieUsername}&maxResults=${this.maxResults}&key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to search playlists: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Found ${data.items?.length || 0} playlists via direct search`);
      
      // Process the search results
      const playlists: PlaylistInfo[] = (data.items || []).map((item: any) => {
        const playlist: PlaylistInfo = {
          id: item.id.playlistId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          itemCount: 0 // We don't have this info from search results
        };
        
        // Cache the playlist
        this.playlists.set(playlist.id, playlist);
        
        return playlist;
      });
      
      return playlists;
    } catch (error) {
      console.error('Error getting playlists by direct search:', error);
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
