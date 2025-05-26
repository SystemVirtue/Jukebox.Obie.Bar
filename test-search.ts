import { searchService } from './src/services/SearchService';

async function testSearch() {
  try {
    console.log('Searching for "BOO"...');
    const results = await searchService.searchMusicVideos('BOO');
    
    console.log(`Found ${results.length} results. Showing top 10 with scores:`);
    
    results.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. [Score: ${result.officialScore}] "${result.title}" by ${result.channelTitle} (ID: ${result.videoId})`);
    });
  } catch (error) {
    console.error('Search error:', error);
  }
}

testSearch();
