import React from 'react';
import { SearchResult } from '../services/SearchService';
import './SearchResults.css';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (videoId: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSelect,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="search-results loading">
        <div className="spinner"></div>
        <p>Searching for music videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="search-results empty">
        <p>No music videos found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-grid">
        {results.map((result, index) => (
          <div 
            key={`${result.videoId}-${index}`} 
            className="result-item"
            onClick={() => onSelect(result.videoId)}
          >
            <div className="thumbnail-container">
              <img 
                src={result.thumbnailUrl} 
                alt={result.title}
                className="thumbnail"
                loading="lazy"
              />
              <div className="play-icon">▶</div>
            </div>
            <div className="video-info">
              <h3 className="video-title" title={result.title}>
                {result.title}
              </h3>
              <p className="channel-title" title={result.channelTitle}>
                {result.channelTitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
