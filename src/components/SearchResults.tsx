import React from 'react';
import { SearchResult } from '../services/SearchService';
import './SearchResults.css';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (videoId: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const SearchResults = ({
  results,
  onSelect,
  isLoading,
  error
}: SearchResultsProps) => {
  // Function to clean up titles by removing text in brackets and quotes
  const cleanTitle = (title: string): string => {
    // Remove text in brackets (both square and round)
    let cleanedTitle = title.replace(/\[.*?\]|\(.*?\)/g, '');
    
    // Remove text in quotes (both single and double)
    cleanedTitle = cleanedTitle.replace(/["'].*?["']/g, '');
    
    // Remove any consecutive spaces and trim
    cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();
    
    return cleanedTitle;
  };
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
        {results.map((result: SearchResult, index: number) => (
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
                {cleanTitle(result.title)}
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
