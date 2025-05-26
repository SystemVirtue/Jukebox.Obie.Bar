import React, { useState, useRef, useEffect } from 'react';
import { SearchButton } from './SearchButton';
import { VirtualKeyboard } from './VirtualKeyboard';
import { SearchResults } from './SearchResults';
import { searchService } from '../services/SearchService';
import { creditsService } from '../services/CreditsService';
import { playerService } from '../services/PlayerService';
import './SearchContainer.css';
import './MainUI.css';
export const SearchContainer = ({ onSelectVideo }) => {
    const [neonOpacity, setNeonOpacity] = useState(0);
    // ...existing state hooks...
    // Neon animation effect
    const [neonTransition, setNeonTransition] = useState('opacity 1.5s linear');
    useEffect(() => {
        let running = true;
        let timeout;
        const animate = () => {
            if (!running)
                return;
            const holdTime = Math.random() * 6 + 6; // 6 to 12 sec
            const fadeInTime = Math.random() * 2.5 + 0.5; // 0.5 to 3.0 sec
            const fadeOutTime = Math.random() * 2.5 + 0.5; // 0.5 to 3.0 sec
            const maxOpacity = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
            setNeonTransition(`opacity ${fadeInTime}s linear`);
            setNeonOpacity(0);
            setTimeout(() => {
                setNeonTransition(`opacity ${fadeInTime}s linear`);
                setNeonOpacity(maxOpacity);
                setTimeout(() => {
                    setNeonTransition(`opacity ${fadeOutTime}s linear`);
                    setNeonOpacity(0);
                    timeout = setTimeout(animate, holdTime * 1000);
                }, fadeInTime * 1000);
            }, holdTime * 1000);
        };
        animate();
        return () => {
            running = false;
            clearTimeout(timeout);
        };
    }, []);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAdminOverlay, setShowAdminOverlay] = useState(false);
    const [creditsRequired, setCreditsRequired] = useState(1);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [availableCredits, setAvailableCredits] = useState(0);
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const adminIframeRef = useRef(null);
    const handleSearchClick = () => {
        setIsSearching(true);
        setSearchResults([]);
        setError(null);
    };
    const handleCloseSearch = () => {
        setIsSearching(false);
        setSearchQuery('');
        setSearchResults([]);
        setError(null);
    };
    // Monitor credit changes
    useEffect(() => {
        const handleCreditsChanged = (event) => {
            const credits = event.detail?.credits || 0;
            setAvailableCredits(credits);
        };
        // Add event listener for credit changes
        document.addEventListener('credits-changed', handleCreditsChanged);
        // Setup keyboard shortcut (Ctrl+P) for opening player
        const handleKeyDown = (event) => {
            // Check for Ctrl+P combination (80 is keyCode for 'P')
            if (event.ctrlKey && event.keyCode === 80) {
                event.preventDefault(); // Prevent default browser print dialog
                handleOpenPlayer();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        // Get initial credit value
        setAvailableCredits(creditsService.getCredits());
        return () => {
            document.removeEventListener('credits-changed', handleCreditsChanged);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    // Add effect to handle messages from admin iframe
    useEffect(() => {
        const handleMessage = (event) => {
            // Verify origin for security
            if (event.origin !== window.location.origin)
                return;
            const { source, command } = event.data || {};
            if (source === 'admin-dashboard') {
                // Handle commands from admin dashboard
                console.log(`Received command from admin dashboard: ${command}`);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);
    // Connect to coin acceptor when component mounts
    useEffect(() => {
        const connectCoinAcceptor = async () => {
            try {
                await creditsService.connectCoinAcceptor();
            }
            catch (err) {
                console.error('Failed to connect to coin acceptor:', err);
            }
        };
        connectCoinAcceptor();
    }, []);
    const handleSearch = async (query) => {
        if (!query.trim())
            return;
        // Special case for admin access
        if (query.trim().toUpperCase() === 'ADMIN') {
            openAdminDashboard();
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const results = await searchService.searchMusicVideos(query);
            setSearchResults(results);
        }
        catch (err) {
            console.error('Search error:', err);
            setError('Failed to search for videos. Please try again.');
            setSearchResults([]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const openAdminDashboard = () => {
        setShowAdminOverlay(true);
        setSearchResults([]);
        // Load admin dashboard in iframe
        if (adminIframeRef.current) {
            adminIframeRef.current.src = '/admin/index.html';
        }
    };
    const closeAdminDashboard = () => {
        setShowAdminOverlay(false);
        // Clear iframe source
        if (adminIframeRef.current) {
            adminIframeRef.current.src = 'about:blank';
        }
    };
    const handleVideoSelect = (videoId) => {
        // Store the selected video and show confirmation
        setSelectedVideo(videoId);
        setShowConfirmation(true);
        // Determine if this is a premium video (demo implementation)
        const isPremiumVideo = Math.random() < 0.3;
        // Calculate required credits using the credits service
        const requiredCredits = creditsService.getVideoCost(videoId, isPremiumVideo);
        setCreditsRequired(requiredCredits);
        // Check if user has enough credits
        setInsufficientCredits(!creditsService.hasEnoughCredits(requiredCredits));
    };
    const confirmVideoSelection = () => {
        if (selectedVideo) {
            // Attempt to deduct credits
            const success = creditsService.deductCredits(creditsRequired);
            if (success) {
                // Instead of playing the video in this window, open the player window
                playerService.openPlayer();
                // Send the selected video to the player window
                playerService.sendCommand({
                    command: 'play',
                    videoId: selectedVideo
                });
                // Reset state
                setSelectedVideo(null);
                setShowConfirmation(false);
                handleCloseSearch();
            }
            else {
                // If not enough credits, show error
                setInsufficientCredits(true);
            }
        }
    };
    const cancelVideoSelection = () => {
        setSelectedVideo(null);
        setShowConfirmation(false);
        setInsufficientCredits(false);
    };
    const handleOpenPlayer = () => {
        playerService.openPlayer();
    };
    return (React.createElement("div", { className: "main-ui-background" },
        React.createElement("img", { src: "/assets/Obie_NEON2.png", className: "neon-bg", alt: "Neon BG" }),
        React.createElement("img", { src: "/assets/Obie_NEON1.png", className: "neon-fg", alt: "Neon FG", style: { opacity: neonOpacity, transition: neonTransition } }),
        React.createElement("video", { className: "shield-crest-video", autoPlay: true, loop: true, muted: true, playsInline: true },
            React.createElement("source", { src: "/assets/Obie_Shield_Crest_Animation2.mp4", type: "video/mp4" }),
            "Your browser does not support the video tag."),
        isLoading && (React.createElement("div", { className: "shield-spinner" },
            React.createElement("img", { src: "/assets/Obie_Shield_BOUNCING_.gif", alt: "Loading..." }))),
        React.createElement("div", { className: "search-container" },
            React.createElement("div", { className: "credits-display" },
                React.createElement("span", { className: "credits-label" }, "Credits:"),
                React.createElement("span", { className: "credits-value" }, availableCredits),
                React.createElement("button", { className: "open-player-button", onClick: handleOpenPlayer, title: "Open Player (Ctrl+P)" },
                    React.createElement("span", { className: "player-icon" }, "\u25B6"),
                    " Open Player")),
            !isSearching ? (React.createElement(SearchButton, { onClick: handleSearchClick })) : (React.createElement("div", { className: "search-interface" },
                React.createElement(VirtualKeyboard, { onSearch: handleSearch, onClose: handleCloseSearch }),
                (searchResults.length > 0 || isLoading || error) && !showAdminOverlay && !showConfirmation && (React.createElement(SearchResults, { results: searchResults, onSelect: handleVideoSelect, isLoading: isLoading, error: error })),
                showAdminOverlay && (React.createElement("div", { className: "admin-overlay" },
                    React.createElement("div", { className: "admin-header" },
                        React.createElement("h2", null, "Admin Dashboard"),
                        React.createElement("button", { className: "close-admin-btn", onClick: closeAdminDashboard }, "\u00D7")),
                    React.createElement("iframe", { ref: adminIframeRef, className: "admin-iframe", title: "Admin Dashboard", src: "/admin/index.html" }))),
                showConfirmation && (React.createElement("div", { className: "confirmation-dialog" },
                    React.createElement("div", { className: "confirmation-content" },
                        React.createElement("h3", null, "Add Video to Queue?"),
                        React.createElement("p", null,
                            "This will use ",
                            creditsRequired,
                            " credit",
                            creditsRequired > 1 ? 's' : '',
                            "."),
                        React.createElement("p", { className: "credit-info" },
                            "Your current balance: ",
                            availableCredits,
                            " credit",
                            availableCredits !== 1 ? 's' : ''),
                        insufficientCredits ? (React.createElement("div", { className: "error-message" },
                            React.createElement("p", null, "Insufficient credits."),
                            React.createElement("p", null, "Please insert coins to continue."))) : null,
                        React.createElement("div", { className: "confirmation-buttons" },
                            React.createElement("button", { onClick: confirmVideoSelection, disabled: insufficientCredits, className: insufficientCredits ? 'disabled' : '' }, "Yes, Play It"),
                            React.createElement("button", { onClick: cancelVideoSelection }, "Cancel"))))))))));
};
//# sourceMappingURL=SearchContainer.js.map