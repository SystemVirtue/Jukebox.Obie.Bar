import React, { useState } from 'react';
import './VirtualKeyboard.css';

interface VirtualKeyboardProps {
  onSearch: (query: string) => void;
  onClose: () => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onSearch, onClose }) => {
  const [input, setInput] = useState('');
  const [showNumbers, setShowNumbers] = useState(false);

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  const handleKeyPress = (key: string) => {
    setInput(prev => prev + key);
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setInput(prev => prev + ' ');
  };

  const handleSearch = () => {
    if (input.trim()) {
      onSearch(input.trim());
      onClose();
    }
  };

  const renderKeys = () => {
    const keys = showNumbers ? numbers : letters;
    return keys.split('').map(char => (
      <button
        key={char}
        className="keyboard-key"
        onClick={() => handleKeyPress(char)}
      >
        {char}
      </button>
    ));
  };

  return (
    <div className="keyboard-container">
      <div className="search-input-container">
        <input
          type="text"
          value={input}
          readOnly
          className="search-input"
          placeholder="Search artists or songs..."
        />
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="keyboard-keys">
        {renderKeys()}
      </div>
      
      <div className="keyboard-controls">
        <button className="keyboard-control-btn" onClick={handleBackspace}>BkSp</button>
        <button className="keyboard-control-btn" onClick={handleSpace}>Space</button>
        <button 
          className="keyboard-control-btn toggle-btn"
          onClick={() => setShowNumbers(!showNumbers)}
        >
          {showNumbers ? 'ABC' : '123'}
        </button>
        <button 
          className="keyboard-control-btn search-btn"
          onClick={handleSearch}
          disabled={!input.trim()}
        >
          SEARCH
        </button>
      </div>
    </div>
  );
};
