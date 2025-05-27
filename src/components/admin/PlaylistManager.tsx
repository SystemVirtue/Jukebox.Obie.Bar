import React, { useState, useEffect } from 'react';
import { PlaylistInfo } from '../../services/AdminService';

export interface PlaylistManagerProps {
  playlists: PlaylistInfo[];
  selectedPlaylist: string | null;
  onPlaylistSelect: (playlistId: string) => void;
  onLoadPlaylist: (playlistId: string) => void;
  onPlayVideo: (videoId: string, playlistId: string, title: string) => void;
  loadingPlaylist: string | null;
  playlistVideos: any[];
  selectedVideo: string | null;
  onPlayNow: (videoId: string, title: string) => void;
  onAddToQueue: (videoId: string, title: string) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  selectedPlaylist,
  onPlaylistSelect,
  onLoadPlaylist,
  onPlayVideo,
  loadingPlaylist,
  playlistVideos,
  selectedVideo,
  onPlayNow,
  onAddToQueue
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVideos(playlistVideos);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = playlistVideos.filter(video => 
        video.snippet.title.toLowerCase().includes(term)
      );
      setFilteredVideos(filtered);
    }
  }, [searchTerm, playlistVideos]);

  return (
    <div className="playlist-manager">
      <h3>Playlist Manager</h3>
      
      <div className="form-group">
        <select
          className="form-control mb-2"
          value={selectedPlaylist || ''}
          onChange={(e) => onPlaylistSelect(e.target.value)}
        >
          <option value="">Select a playlist</option>
          {playlists.map(playlist => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.title} ({playlist.itemCount} videos)
            </option>
          ))}
        </select>
        
        <button
          className="btn btn-primary w-100 mb-3"
          onClick={() => selectedPlaylist && onLoadPlaylist(selectedPlaylist)}
          disabled={!selectedPlaylist || loadingPlaylist === selectedPlaylist}
        >
          {loadingPlaylist === selectedPlaylist ? 'Loading...' : 'Load Playlist'}
        </button>
      </div>

      {playlistVideos.length > 0 && (
        <div className="playlist-videos">
          <div className="form-group">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Search in playlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="video-list">
            {filteredVideos.map(video => (
              <div 
                key={video.id}
                className={`video-item ${selectedVideo === video.id ? 'active' : ''}`}
                onClick={() => onPlayVideo(video.id, video.snippet.playlistId, video.snippet.title)}
              >
                <div className="video-thumbnail">
                  <img 
                    src={video.snippet.thumbnails?.default?.url || ''} 
                    alt={video.snippet.title}
                  />
                </div>
                <div className="video-details">
                  <div className="video-title">{video.snippet.title}</div>
                  <div className="video-actions">
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayNow(video.id, video.snippet.title);
                      }}
                    >
                      Play Now
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(video.id, video.snippet.title);
                      }}
                    >
                      Add to Queue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;
