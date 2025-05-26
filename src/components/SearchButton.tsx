import * as React from 'react';
import './SearchButton.css';

interface SearchButtonProps {
  onClick: () => void;
}

export const SearchButton = ({ onClick }: SearchButtonProps) => {
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

export default SearchButton;
