// Simple test script to search for "BOO" and display results
// This is designed to be run in the browser console

async function testBooSearch() {
  const query = "BOO";
  console.log(`Searching for "${query}"...`);
  
  try {
    // Use the window.searchService if available (assuming it's exposed)
    const results = await window.searchService.searchMusicVideos(query);
    
    console.log(`Found ${results.length} results. Top 10 with scores:`);
    
    results.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. [Score: ${result.officialScore}] "${result.title}" by ${result.channelTitle} (ID: ${result.videoId})`);
    });
    
    return results; // Return for further inspection
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

// This will be manually run in the browser console
console.log("Test function ready. Run testBooSearch() in the console to execute the search.");
