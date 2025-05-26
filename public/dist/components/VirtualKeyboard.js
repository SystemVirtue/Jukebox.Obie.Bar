import React, { useState } from 'react';
import './VirtualKeyboard.css';
export const VirtualKeyboard = ({ onSearch, onClose }) => {
    const [input, setInput] = useState('');
    const [showNumbers, setShowNumbers] = useState(false);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const handleKeyPress = (key) => {
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
        return keys.split('').map(char => (React.createElement("button", { key: char, className: "keyboard-key", onClick: () => handleKeyPress(char) }, char)));
    };
    return (React.createElement("div", { className: "keyboard-container" },
        React.createElement("div", { className: "search-input-container" },
            React.createElement("input", { type: "text", value: input, readOnly: true, className: "search-input", placeholder: "Search artists or songs..." }),
            React.createElement("button", { className: "close-button", onClick: onClose }, "\u00D7")),
        React.createElement("div", { className: "keyboard-keys" }, renderKeys()),
        React.createElement("div", { className: "keyboard-controls" },
            React.createElement("button", { className: "keyboard-control-btn", onClick: handleBackspace }, "BkSp"),
            React.createElement("button", { className: "keyboard-control-btn", onClick: handleSpace }, "Space"),
            React.createElement("button", { className: "keyboard-control-btn toggle-btn", onClick: () => setShowNumbers(!showNumbers) }, showNumbers ? 'ABC' : '123'),
            React.createElement("button", { className: "keyboard-control-btn search-btn", onClick: handleSearch, disabled: !input.trim() }, "SEARCH"))));
};
//# sourceMappingURL=VirtualKeyboard.js.map