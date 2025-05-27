// =============================================================================
// ==                               player.js                                 ==
// ==          Handles the YouTube IFrame Player and Communication            ==
// =============================================================================

// --- Global Variables & Constants ---
const COMMAND_STORAGE_KEY = 'jukeboxCommand'; // Key for receiving commands
const STATUS_STORAGE_KEY = 'jukeboxStatus';   // Key for sending status back
const PLAYER_READY_TIMEOUT_MS = 15000; // Timeout for player init
const FADE_INTERVAL_MS = 50;   // Interval for audio fade steps

let player; // Holds the YT.Player object
let isPlayerReady = false;
let apiReadyCheckTimeoutId = null; // Timeout ID for API readiness check
let currentPlayerVideoId = null; // Track ID of video loaded in player
let fadeIntervalId = null; // ID for audio fade timer
let isFadingOut = false; // Local flag for fading state

// DOM Reference for Fade Overlay (cached on DOM Ready)
let fadeOverlay = null;


// --- YouTube IFrame API Setup ---

// This function is called automatically by the YouTube API script when it's ready
window.onYouTubeIframeAPIReady = function() {
    console.log("DEBUG: [PlayerWin] >>> onYouTubeIframeAPIReady called <<<");
    if (apiReadyCheckTimeoutId) {
        clearTimeout(apiReadyCheckTimeoutId);
        console.log("DEBUG: [PlayerWin] Cleared API ready timeout.");
    }

    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        console.error("DEBUG: [PlayerWin] FATAL - YT or YT.Player is UNDEFINED!");
        displayPlayerError("YT API Load Fail");
        isPlayerReady = false;
        return;
    }
    console.log("DEBUG: [PlayerWin] YT object available.");

    try {
        const targetElement = document.getElementById('youtube-fullscreen-player');
        if (!targetElement) {
            console.error("DEBUG: [PlayerWin] FATAL - Target element '#youtube-fullscreen-player' missing!");
            displayPlayerError("Player Div Missing");
            isPlayerReady = false;
            return;
        }
        console.log("DEBUG: [PlayerWin] Target element found.");

        // Helper function to create player once the container has dimensions
        function createPlayerWhenReady() {
            const rect = targetElement.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(targetElement);
            console.log(`DEBUG: [PlayerWin] Checking dimensions - W: ${rect.width}, H: ${rect.height}, Display: ${computedStyle.display}`);

            if (rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none') {
                console.log("DEBUG: [PlayerWin] Target element has dimensions. Creating player.");
                try {
                     player = new YT.Player('youtube-fullscreen-player', {
                        height: '100%',
                        width: '100%',
                        playerVars: {
                            'playsinline': 1,
                            'controls': 0,        // Hide controls
                            'rel': 0,             // Don't show related videos
                            'autoplay': 1,        // Enable autoplay
                            'mute': 1             // Start muted to bypass autoplay restrictions
                            // REMOVED restrictive parameters that caused embed issues
                        },
                        events: {
                             'onReady': onPlayerWindowReady,
                             'onStateChange': onPlayerWindowStateChange,
                             'onError': onPlayerWindowError
                        }
                    });

                     if (player && typeof player.addEventListener === 'function') {
                        console.log("DEBUG: [PlayerWin] YT.Player object CREATED (waiting for onReady event).");
                     } else {
                        console.error("DEBUG: [PlayerWin] YT.Player object creation FAILED silently.");
                        isPlayerReady = false; displayPlayerError("Player Object Create Fail");
                     }
                } catch(e) {
                     console.error("DEBUG: [PlayerWin] CRITICAL - Exception during new YT.Player() constructor.", e);
                     isPlayerReady = false; displayPlayerError("Player Create Exception");
                }
            } else {
                console.log("DEBUG: [PlayerWin] Target element has zero dimensions or is hidden. Retrying...");
                setTimeout(createPlayerWhenReady, 100); // Check again shortly
            }
        }
        // Start checking for dimensions
        createPlayerWhenReady();

    } catch (e) {
        console.error("DEBUG: [PlayerWin] Error in onYouTubeIframeAPIReady:", e);
        isPlayerReady = false; displayPlayerError("Initialization Error");
    }
};

// Called by the YouTube API when the player is fully initialized and ready
function onPlayerWindowReady(event) {
    console.log("%c DEBUG: [PlayerWin] >>> onPlayerWindowReady EVENT FIRED <<<", "color: green; font-weight: bold;");
    isPlayerReady = true;
    console.log("DEBUG: [PlayerWin][Ready] isPlayerReady flag set to TRUE");

    if(player && typeof player.getPlayerState === 'function') {
        console.log("DEBUG: [PlayerWin][Ready] Initial Player State:", player.getPlayerState());
    }

    // Cache overlay element if not done yet
    if (!fadeOverlay) {
        fadeOverlay = document.getElementById('fade-overlay');
        if (!fadeOverlay) console.error("DEBUG: [PlayerWin][Ready] Fade overlay element not found!");
    }

    // Force initial playback state to ensure autoplay works
    if (typeof player.playVideo === 'function') {
        console.log("DEBUG: [PlayerWin][Ready] Explicitly calling playVideo() to ensure autoplay");
        player.playVideo();
        // If video is muted, we'll try to unmute after playback starts
        setTimeout(() => {
            try {
                if (player && typeof player.unMute === 'function' && typeof player.getPlayerState === 'function') {
                    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                        player.unMute();
                        console.log("DEBUG: [PlayerWin] Successfully unmuted after autoplay");
                    }
                }
            } catch(e) {
                console.warn("DEBUG: [PlayerWin] Failed to unmute:", e);
            }
        }, 1000); // Delay to allow playback to start
    }

    // Send a 'ready' status back to the main window (optional, but good practice)
    sendPlayerStatus('ready');

    // Check if a command was sent before the player was ready
    processStoredCommand();
}

// Called by the YouTube API when the player's state changes (playing, paused, ended, etc.)
function onPlayerWindowStateChange(event) {
    const newState = event.data;
    console.log("DEBUG: [PlayerWin] State Change:", newState, `(${ YT.PlayerState[newState] || 'Unknown' })`);

    if (newState === YT.PlayerState.ENDED && !isFadingOut) {
        console.log("DEBUG: [PlayerWin] Video Ended naturally. Sending 'ended' status.");
        sendPlayerStatus('ended', { id: currentPlayerVideoId });
        currentPlayerVideoId = null; // Clear current video after it ends
    } else if (newState === YT.PlayerState.PLAYING) {
         console.log("DEBUG: [PlayerWin] Video State: PLAYING.");
         try {
             // Update current ID if possible, useful if loaded via ID directly
             const videoData = event.target?.getVideoData?.();
             if (videoData?.video_id) {
                 currentPlayerVideoId = videoData.video_id;
             }
         } catch(e){ console.warn("Could not get video data on play state change:", e); }
         resetFadeOverlayVisuals(); // Ensure overlay is hidden if playing starts
    } else if (newState === YT.PlayerState.PAUSED) {
         console.log("DEBUG: [PlayerWin] Video State: PAUSED.");
         // Handle pause if needed
    } else if (newState === YT.PlayerState.BUFFERING) {
         console.log("DEBUG: [PlayerWin] Video State: BUFFERING.");
         // Handle buffering if needed
    } else if (newState === YT.PlayerState.CUED) {
         console.log("DEBUG: [PlayerWin] Video State: CUED.");
         // Video is loaded but not playing yet
         // If autoplay is on, PLAYING state should follow shortly
    }
}

// Called by the YouTube API if an error occurs in the player
function onPlayerWindowError(event) {
    console.error(`%c DEBUG: [PlayerWin] >>> onPlayerError EVENT FIRED <<< Code: ${event.data}`, "color: red; font-weight: bold;");
    const errorMessages = { 2: 'Invalid parameter', 5: 'HTML5 player error', 100: 'Video not found', 101: 'Playback disallowed (embed)', 150: 'Playback disallowed (embed)' };
    const errorMessage = errorMessages[event.data] || `Unknown error (${event.data})`;
    
    console.error(`DEBUG: [PlayerWin] Error details: ${errorMessage}`);
    
    // Send error status back to main window
    sendPlayerStatus('error', { 
        errorCode: event.data,
        errorMessage: errorMessage,
        id: currentPlayerVideoId 
    });
    
    // Display error visually to user if serious
    if (event.data === 100 || event.data === 101 || event.data === 150) {
        displayPlayerError(errorMessage);
    }
    
    // Clear current video on fatal errors
    if (event.data === 100 || event.data === 101 || event.data === 150) {
        currentPlayerVideoId = null;
    }
}

// --- Communication with Main Window ---

// Load and process any command from localStorage
function processStoredCommand() {
    try {
        const storedCommandJSON = localStorage.getItem(COMMAND_STORAGE_KEY);
        if (!storedCommandJSON) return;
        
        console.log('DEBUG: [PlayerWin] Found stored command: ', storedCommandJSON);
        
        // Parse the command
        const command = JSON.parse(storedCommandJSON);
        
        // Check command validity and timestamp
        if (!command || !command.action) {
            console.warn('DEBUG: [PlayerWin] Invalid command format');
            localStorage.removeItem(COMMAND_STORAGE_KEY);
            return;
        }
        
        // Check if command is fresh enough (within last 30 seconds)
        const now = Date.now();
        if (command.timestamp && (now - command.timestamp > 30000)) {
            console.warn('DEBUG: [PlayerWin] Command expired - skipping');
            localStorage.removeItem(COMMAND_STORAGE_KEY);
            return;
        }
        
        // Execute the command
        executeCommand(command);
        
        // Remove the command after processing
        localStorage.removeItem(COMMAND_STORAGE_KEY);
    } catch (e) {
        console.error('DEBUG: [PlayerWin] Error processing stored command:', e);
        localStorage.removeItem(COMMAND_STORAGE_KEY);
    }
}

// Execute a command received from the main window
function executeCommand(command) {
    if (!command || !command.action) {
        console.warn('DEBUG: [PlayerWin] Invalid command or missing action');
        return;
    }

    console.log(`DEBUG: [PlayerWin] Executing command: ${command.action}`, command);

    switch (command.action) {
        case 'play':
            if (!command.videoId) {
                console.error('DEBUG: [PlayerWin] Missing videoId for play command');
                return;
            }
            
            if (!isPlayerReady || !player) {
                console.warn('DEBUG: [PlayerWin] Player not ready yet, storing command for later');
                localStorage.setItem(COMMAND_STORAGE_KEY, JSON.stringify({
                    ...command,
                    timestamp: Date.now()
                }));
                return;
            }
            
            // Only load if different from current video
            if (currentPlayerVideoId !== command.videoId) {
                console.log(`DEBUG: [PlayerWin] Loading video: ${command.videoId}`);
                currentPlayerVideoId = command.videoId;
                
                if (typeof player.loadVideoById === 'function') {
                    player.loadVideoById(command.videoId);
                } else {
                    console.error('DEBUG: [PlayerWin] Player loadVideoById method not available');
                    displayPlayerError("Player Method Missing");
                }
                
                // Send status back to main window
                sendPlayerStatus('loading', { id: command.videoId });
            } else {
                // If it's the same video, just play it
                console.log('DEBUG: [PlayerWin] Already loaded, just playing');
                if (typeof player.playVideo === 'function') {
                    player.playVideo();
                }
            }
            break;
            
        case 'pause':
            if (isPlayerReady && player && typeof player.pauseVideo === 'function') {
                console.log('DEBUG: [PlayerWin] Pausing video');
                player.pauseVideo();
                sendPlayerStatus('paused');
            }
            break;
            
        case 'stop':
            if (isPlayerReady && player && typeof player.stopVideo === 'function') {
                console.log('DEBUG: [PlayerWin] Stopping video');
                player.stopVideo();
                currentPlayerVideoId = null;
                sendPlayerStatus('stopped');
            }
            break;
            
        case 'fadeOut':
            if (isPlayerReady && player) {
                console.log('DEBUG: [PlayerWin] Starting fade out');
                startFadeOut(command.duration || 2000); // Default to 2 seconds if not specified
            }
            break;
            
        case 'setVolume':
            if (isPlayerReady && player && typeof player.setVolume === 'function') {
                const volumeLevel = Math.min(100, Math.max(0, command.volume || 100));
                console.log(`DEBUG: [PlayerWin] Setting volume: ${volumeLevel}`);
                player.setVolume(volumeLevel);
                sendPlayerStatus('volumeSet', { volume: volumeLevel });
            }
            break;
            
        default:
            console.warn(`DEBUG: [PlayerWin] Unknown command action: ${command.action}`);
    }
}

// Send player status back to main window using localStorage
function sendPlayerStatus(status, data = {}) {
    const statusPacket = {
        status: status,
        timestamp: Date.now(),
        ...data
    };
    
    console.log(`DEBUG: [PlayerWin] Sending status: ${status}`, statusPacket);
    
    try {
        localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statusPacket));
    } catch (e) {
        console.error('DEBUG: [PlayerWin] Error sending status:', e);
    }
}

// --- Player Visual Effects ---

// Show an error message to the user
function displayPlayerError(message) {
    // Simple console error for now
    console.error(`%c PLAYER ERROR: ${message}`, 'background: red; color: white; font-size: 16px;');
    
    // Create a visual overlay if doesn't exist
    const errorOverlay = document.getElementById('error-overlay') || createErrorOverlay();
    
    // Update and show error message
    if (errorOverlay) {
        const messageElement = errorOverlay.querySelector('.error-message') || 
                             document.createElement('div');
        
        if (!messageElement.classList.contains('error-message')) {
            messageElement.className = 'error-message';
            errorOverlay.appendChild(messageElement);
        }
        
        messageElement.textContent = `Error: ${message}`;
        errorOverlay.style.display = 'flex';
    }
}

// Create error overlay element
function createErrorOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'error-overlay';
    overlay.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); color: white; z-index: 9999; justify-content: center; align-items: center; flex-direction: column;';
    
    const messageEl = document.createElement('div');
    messageEl.className = 'error-message';
    messageEl.style.cssText = 'font-size: 24px; margin-bottom: 20px; color: white; text-align: center; max-width: 80%;';
    
    overlay.appendChild(messageEl);
    document.body.appendChild(overlay);
    
    return overlay;
}

// Start visual and audio fade out effect
function startFadeOut(duration = 2000) {
    if (isFadingOut) return; // Prevent multiple fades
    isFadingOut = true;
    
    // Ensure we have the overlay
    if (!fadeOverlay) {
        fadeOverlay = document.getElementById('fade-overlay');
        if (!fadeOverlay) {
            console.warn('DEBUG: [PlayerWin] Fade overlay not found for fade effect');
            // Create it dynamically as fallback
            fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            fadeOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: black; opacity: 0; z-index: 1000; pointer-events: none; transition: opacity 0.2s ease-in-out;';
            document.body.appendChild(fadeOverlay);
        }
    }
    
    // Start visual fade in of the overlay
    fadeOverlay.style.opacity = '0';
    fadeOverlay.style.display = 'block';
    
    // Smoothly fade in black overlay
    setTimeout(() => {
        fadeOverlay.style.opacity = '1';
    }, 50);
    
    // Get current volume
    let currentVolume = 100;
    try {
        if (player && typeof player.getVolume === 'function') {
            currentVolume = player.getVolume() || 100;
        }
    } catch(e) {
        console.warn('DEBUG: [PlayerWin] Could not get player volume:', e);
    }
    
    // Calculate number of steps for the fade
    const steps = Math.max(5, Math.ceil(duration / FADE_INTERVAL_MS));
    const volumeStep = currentVolume / steps;
    let step = 0;
    
    // Clear any existing fade
    if (fadeIntervalId) clearInterval(fadeIntervalId);
    
    // Start the fade interval
    fadeIntervalId = setInterval(() => {
        step++;
        
        // Calculate new volume
        const newVolume = Math.max(0, currentVolume - (volumeStep * step));
        
        // Apply volume to player
        try {
            if (player && typeof player.setVolume === 'function') {
                player.setVolume(newVolume);
            }
        } catch(e) {
            console.warn('DEBUG: [PlayerWin] Error setting volume during fade:', e);
        }
        
        // When fade is complete
        if (step >= steps) {
            clearInterval(fadeIntervalId);
            fadeIntervalId = null;
            
            // Stop the video
            try {
                if (player && typeof player.stopVideo === 'function') {
                    player.stopVideo();
                }
            } catch(e) {
                console.warn('DEBUG: [PlayerWin] Error stopping video after fade:', e);
            }
            
            // Send completed status
            sendPlayerStatus('fadedOut');
            
            // Reset the player for next video
            setTimeout(() => {
                resetPlayerAfterFade(currentVolume);
            }, 500);
        }
    }, FADE_INTERVAL_MS);
}

// Reset player after fade is complete
function resetPlayerAfterFade(originalVolume) {
    // Restore volume
    try {
        if (player && typeof player.setVolume === 'function') {
            player.setVolume(originalVolume);
        }
    } catch(e) {
        console.warn('DEBUG: [PlayerWin] Error restoring volume after fade:', e);
    }
    
    // Clear current video ID
    currentPlayerVideoId = null;
    
    // Reset fade flag
    isFadingOut = false;
    
    // Inform main window that player is ready for new video
    sendPlayerStatus('ready');
    
    // Reset overlay with a delay to avoid flicker
    setTimeout(resetFadeOverlayVisuals, 200);
}

// Reset the visual overlay
function resetFadeOverlayVisuals() {
    if (fadeOverlay) {
        fadeOverlay.style.opacity = '0';
        // After transition completes, hide the element completely
        setTimeout(() => {
            if (fadeOverlay) fadeOverlay.style.display = 'none';
        }, 300);
    }
}

// --- Initialization ---

// Setup communication channel with main window
document.addEventListener('DOMContentLoaded', () => {
    console.log('DEBUG: [PlayerWin] DOM content loaded - Player window initializing');
    
    // Cache the fade overlay element
    fadeOverlay = document.getElementById('fade-overlay');
    
    // Watch for changes to localStorage to receive commands
    window.addEventListener('storage', function(event) {
        if (event.key === COMMAND_STORAGE_KEY && event.newValue) {
            try {
                const command = JSON.parse(event.newValue);
                executeCommand(command);
                // Remove the command to acknowledge it
                localStorage.removeItem(COMMAND_STORAGE_KEY);
            } catch (e) {
                console.error('DEBUG: [PlayerWin] Error processing command from storage event:', e);
            }
        }
    });
    
    // Set a timeout to check if YouTube API loaded
    apiReadyCheckTimeoutId = setTimeout(() => {
        if (!isPlayerReady) {
            console.error('DEBUG: [PlayerWin] YouTube API failed to initialize within timeout period!');
            displayPlayerError('YouTube API Load Timeout');
        }
    }, PLAYER_READY_TIMEOUT_MS);
    
    // Process any commands that were sent before the page loaded
    setTimeout(() => {
        processStoredCommand();
    }, 1000);
});
