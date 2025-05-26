import { searchService } from './services/SearchService';
import { playerService } from './services/PlayerService';
// Create search dialog functionality
const createSearchDialog = () => {
    console.log('Creating search dialog...');
    // Create container for search UI
    const searchContainer = document.createElement('div');
    searchContainer.id = 'search-dialog-container';
    searchContainer.style.position = 'fixed';
    searchContainer.style.top = '0';
    searchContainer.style.left = '0';
    searchContainer.style.width = '100%';
    searchContainer.style.height = '100%';
    searchContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    searchContainer.style.zIndex = '100000';
    searchContainer.style.display = 'flex';
    searchContainer.style.flexDirection = 'column';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.justifyContent = 'center';
    searchContainer.style.padding = '20px';
    document.body.appendChild(searchContainer);
    // Create keyboard container
    const keyboardContainer = document.createElement('div');
    keyboardContainer.className = 'keyboard-container';
    keyboardContainer.style.width = '90%';
    keyboardContainer.style.maxWidth = '800px';
    keyboardContainer.style.margin = '0 auto';
    keyboardContainer.style.backgroundColor = '#222';
    keyboardContainer.style.borderRadius = '8px';
    keyboardContainer.style.padding = '20px';
    keyboardContainer.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.3)';
    keyboardContainer.style.position = 'relative';
    searchContainer.appendChild(keyboardContainer);
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search artists or songs...';
    searchInput.style.width = '100%';
    searchInput.style.padding = '15px';
    searchInput.style.fontSize = '24px';
    searchInput.style.marginBottom = '20px';
    searchInput.style.borderRadius = '4px';
    searchInput.style.border = 'none';
    keyboardContainer.appendChild(searchInput);
    // Create virtual keyboard
    const keyboard = document.createElement('div');
    keyboard.className = 'virtual-keyboard';
    keyboard.style.display = 'grid';
    keyboard.style.gridTemplateColumns = 'repeat(10, 1fr)';
    keyboard.style.gap = '5px';
    keyboard.style.marginBottom = '15px';
    keyboardContainer.appendChild(keyboard);
    // Generate letter keys
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    letters.split('').forEach(letter => {
        const key = document.createElement('button');
        key.textContent = letter;
        key.className = 'keyboard-key';
        key.style.padding = '15px 0';
        key.style.fontSize = '20px';
        key.style.backgroundColor = '#333';
        key.style.color = 'white';
        key.style.border = 'none';
        key.style.borderRadius = '4px';
        key.style.cursor = 'pointer';
        key.addEventListener('click', () => {
            searchInput.value += letter;
        });
        keyboard.appendChild(key);
    });
    // Create keyboard controls
    const controls = document.createElement('div');
    controls.className = 'keyboard-controls';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    controls.style.gap = '10px';
    keyboardContainer.appendChild(controls);
    // Backspace button
    const backspace = document.createElement('button');
    backspace.textContent = 'Backspace';
    backspace.className = 'keyboard-control-btn';
    backspace.style.flex = '1';
    backspace.style.padding = '15px';
    backspace.style.fontSize = '18px';
    backspace.style.backgroundColor = '#444';
    backspace.style.color = 'white';
    backspace.style.border = 'none';
    backspace.style.borderRadius = '4px';
    backspace.style.cursor = 'pointer';
    backspace.addEventListener('click', () => {
        searchInput.value = searchInput.value.slice(0, -1);
    });
    controls.appendChild(backspace);
    // Space button
    const space = document.createElement('button');
    space.textContent = 'Space';
    space.className = 'keyboard-control-btn';
    space.style.flex = '1';
    space.style.padding = '15px';
    space.style.fontSize = '18px';
    space.style.backgroundColor = '#444';
    space.style.color = 'white';
    space.style.border = 'none';
    space.style.borderRadius = '4px';
    space.style.cursor = 'pointer';
    space.addEventListener('click', () => {
        searchInput.value += ' ';
    });
    controls.appendChild(space);
    // Search button
    const searchBtn = document.createElement('button');
    searchBtn.textContent = 'SEARCH';
    searchBtn.className = 'keyboard-control-btn search-btn';
    searchBtn.style.flex = '1';
    searchBtn.style.padding = '15px';
    searchBtn.style.fontSize = '18px';
    searchBtn.style.backgroundColor = '#ff0000';
    searchBtn.style.color = 'white';
    searchBtn.style.border = 'none';
    searchBtn.style.borderRadius = '4px';
    searchBtn.style.cursor = 'pointer';
    searchBtn.addEventListener('click', async () => {
        if (searchInput.value.trim()) {
            // Show loading indicator
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px;"><p style="color: white;">Searching...</p></div>';
            // Perform search
            try {
                const results = await searchService.searchMusicVideos(searchInput.value.trim());
                displaySearchResults(results);
            }
            catch (error) {
                resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px;"><p style="color: white;">Error: ${error}</p></div>`;
            }
        }
    });
    controls.appendChild(searchBtn);
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '5px 10px';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(searchContainer);
    });
    keyboardContainer.appendChild(closeBtn);
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-container';
    resultsContainer.style.width = '90%';
    resultsContainer.style.maxWidth = '800px';
    resultsContainer.style.marginTop = '20px';
    resultsContainer.style.maxHeight = '50vh';
    resultsContainer.style.overflowY = 'auto';
    searchContainer.appendChild(resultsContainer);
    // Function to display search results
    const displaySearchResults = (results) => {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px;"><p style="color: white;">No results found. Try a different search term.</p></div>';
            return;
        }
        resultsContainer.innerHTML = '';
        // Create grid for results
        const grid = document.createElement('div');
        grid.className = 'results-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        grid.style.gap = '15px';
        grid.style.padding = '10px';
        resultsContainer.appendChild(grid);
        // Add each result to the grid
        results.forEach((result) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.style.backgroundColor = '#333';
            item.style.borderRadius = '4px';
            item.style.overflow = 'hidden';
            item.style.cursor = 'pointer';
            item.style.transition = 'transform 0.2s';
            item.style.position = 'relative';
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.05)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
            });
            // Add click handler to play video
            item.addEventListener('click', () => {
                playerService.openPlayer();
                playerService.sendCommand({
                    command: 'play',
                    videoId: result.videoId
                });
                document.body.removeChild(searchContainer); // Close search after selection
            });
            // Thumbnail
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'thumbnail-container';
            thumbnailContainer.style.position = 'relative';
            const thumbnail = document.createElement('img');
            thumbnail.src = result.thumbnailUrl;
            thumbnail.alt = result.title;
            thumbnail.style.width = '100%';
            thumbnail.style.height = 'auto';
            thumbnailContainer.appendChild(thumbnail);
            // Play icon overlay
            const playIcon = document.createElement('div');
            playIcon.className = 'play-icon';
            playIcon.textContent = '▶';
            playIcon.style.position = 'absolute';
            playIcon.style.top = '50%';
            playIcon.style.left = '50%';
            playIcon.style.transform = 'translate(-50%, -50%)';
            playIcon.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            playIcon.style.color = 'white';
            playIcon.style.borderRadius = '50%';
            playIcon.style.width = '40px';
            playIcon.style.height = '40px';
            playIcon.style.display = 'flex';
            playIcon.style.alignItems = 'center';
            playIcon.style.justifyContent = 'center';
            playIcon.style.fontSize = '18px';
            thumbnailContainer.appendChild(playIcon);
            item.appendChild(thumbnailContainer);
            // Video info
            const videoInfo = document.createElement('div');
            videoInfo.className = 'video-info';
            videoInfo.style.padding = '10px';
            const title = document.createElement('h3');
            title.className = 'video-title';
            title.textContent = result.title;
            title.style.margin = '0 0 5px 0';
            title.style.fontSize = '16px';
            title.style.color = 'white';
            title.style.overflow = 'hidden';
            title.style.textOverflow = 'ellipsis';
            title.style.whiteSpace = 'nowrap';
            videoInfo.appendChild(title);
            const channelTitle = document.createElement('p');
            channelTitle.className = 'channel-title';
            channelTitle.textContent = result.channelTitle;
            channelTitle.style.margin = '0';
            channelTitle.style.fontSize = '14px';
            channelTitle.style.color = '#aaa';
            channelTitle.style.overflow = 'hidden';
            channelTitle.style.textOverflow = 'ellipsis';
            channelTitle.style.whiteSpace = 'nowrap';
            videoInfo.appendChild(channelTitle);
            item.appendChild(videoInfo);
            grid.appendChild(item);
        });
    };
    // Focus on the input
    searchInput.focus();
};
// Register the search function globally
window.openSearchDialog = createSearchDialog;
// Listen for the custom event
window.addEventListener('jukeboxSearchRequested', () => {
    console.log('Search requested event received');
    createSearchDialog();
});
// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Jukebox search module initialized');
});
// Execute this immediately to make sure it's registered
console.log('Jukebox search script loaded');
//# sourceMappingURL=jukebox-search.js.map