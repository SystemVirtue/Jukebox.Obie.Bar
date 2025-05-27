import React, { useState, forwardRef } from 'react';
import './VirtualKeyboard.css';

interface VirtualKeyboardProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const VirtualKeyboard = forwardRef<HTMLInputElement, VirtualKeyboardProps>(({ onSearch, onClose, inputRef }, ref) => {
  const [input, setInput] = useState('');
  const [showNumbers, setShowNumbers] = useState(false);

  // QWERTY layout rows
  const topRow = 'ABCDEFGHIJKLM';
  const middleRow = 'NOPQRSTUVWXYZ';
  const bottomRow = '';
  const numbers = '1234567890';

  const handleKeyPress = (key: string) => {
    setInput((prev: string) => prev + key);
  };

  const handleBackspace = () => {
    setInput((prev: string) => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setInput((prev: string) => prev + ' ');
  };

  const handleSearch = () => {
    if (input.trim()) {
      console.log('VirtualKeyboard: Triggering search with query:', input.trim());
      // Call onSearch but DON'T close the dialog immediately so results can be seen
      onSearch(input.trim());
      // Do not call onClose() immediately - let the user see the results
    }
  };

  const renderKeys = () => {
    if (showNumbers) {
      // Render numbers row
      return numbers.split('').map(char => (
        <button
          key={char}
          className="keyboard-key"
          onClick={() => handleKeyPress(char)}
        >
          {char}
        </button>
      ));
    } else {
      // Render QWERTY keyboard layout
      return (
        <>
          {/* Top row */}
          {topRow.split('').map(char => (
            <button
              key={char}
              className="keyboard-key"
              onClick={() => handleKeyPress(char)}
            >
              {char}
            </button>
          ))}
          {/* Add a div to create a new row with a class for proper styling */}
          <div className="keyboard-row-break"></div>
          
          {/* Middle row with offset */}
          <div className="keyboard-row-spacer"></div>
          {middleRow.split('').map(char => (
            <button
              key={char}
              className="keyboard-key"
              onClick={() => handleKeyPress(char)}
            >
              {char}
            </button>
          ))}
      <div className="keyboard-row-spacer"></div>
        {/* Bottom row with offset*/}
          <div className="keyboard-row-break"></div>
          <div className="keyboard-row-spacer"></div>
          <div className="keyboard-row-spacer"></div>
          {bottomRow.split('').map(char => (
            <button
              key={char}
              className="keyboard-key"
              onClick={() => handleKeyPress(char)}
            >
              {char}
            </button>
          ))}
          <div className="keyboard-row-spacer"></div>
          <div className="keyboard-row-spacer"></div>
        </>
      );
    }
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
          ref={ref || inputRef}
        />
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="keyboard-keys">
        {renderKeys()}
      </div>
      
      <div className="keyboard-controls">
        <button className="keyboard-control-btn" onClick={handleBackspace}>Delete</button>
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
});
