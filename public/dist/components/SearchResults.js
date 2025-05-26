import React from 'react';
import './SearchResults.css';
export const SearchResults = ({ results, onSelect, isLoading, error }) => {
    if (isLoading) {
        return (React.createElement("div", { className: "search-results loading" },
            React.createElement("div", { className: "spinner" }),
            React.createElement("p", null, "Searching for music videos...")));
    }
    if (error) {
        return (React.createElement("div", { className: "search-results error" },
            React.createElement("p", null,
                "Error: ",
                error)));
    }
    if (results.length === 0) {
        return (React.createElement("div", { className: "search-results empty" },
            React.createElement("p", null, "No music videos found. Try a different search term.")));
    }
    return (React.createElement("div", { className: "search-results" },
        React.createElement("div", { className: "results-grid" }, results.map((result, index) => (React.createElement("div", { key: `${result.videoId}-${index}`, className: "result-item", onClick: () => onSelect(result.videoId) },
            React.createElement("div", { className: "thumbnail-container" },
                React.createElement("img", { src: result.thumbnailUrl, alt: result.title, className: "thumbnail", loading: "lazy" }),
                React.createElement("div", { className: "play-icon" }, "\u25B6")),
            React.createElement("div", { className: "video-info" },
                React.createElement("h3", { className: "video-title", title: result.title }, result.title),
                React.createElement("p", { className: "channel-title", title: result.channelTitle }, result.channelTitle))))))));
};
//# sourceMappingURL=SearchResults.js.map