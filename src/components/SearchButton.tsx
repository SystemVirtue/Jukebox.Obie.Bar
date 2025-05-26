import React from 'react';
import './SearchButton.css';

interface SearchButtonProps {
  onClick: () => void;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="search-button"
      onClick={onClick}
      aria-label="Search all artists and songs"
    >
      SEARCH ALL ARTISTS & SONGS
    </button>
  );
};
