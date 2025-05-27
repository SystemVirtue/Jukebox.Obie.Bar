import { YouTubeConfig } from '../config/youtube.config';

// TESTING DEBUG LOGGING
console.log('%c DEBUG TEST - SearchService loaded', 'background:blue; color:white; font-size:15px;');

export interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  officialScore?: number;
}

export class SearchService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      throw new Error('YouTube Data API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  public async searchMusicVideos(query: string): Promise<SearchResult[]> {
    document.title = 'DEBUG: Starting Search - ' + query;
    
    try {
      // Simple direct debug for testing
      console.log('======================================');
      console.log('🔍 SEARCH STARTED: "' + query + '"');
      console.log('======================================');
      
      const searchQuery = query.trim();
      if (!searchQuery) {
        console.log('❌ Empty search query');
        return [];
      }

      // Step 1: Search YouTube for videos in Category 10 (Music)
      // We request more results initially to have a larger pool for client-side filtering.
      // Make sure we're requesting the right video category for music (10)
      console.log('%c CREATING SEARCH URL', 'background:green; color:white; font-size:14px');
      
      // Explicitly verify key parts of the URL to ensure they're included
      const encodedQuery = encodeURIComponent(searchQuery);
      const videoCategoryParam = 'videoCategoryId=10';
      const typeParam = 'type=video';
      const maxResultsParam = 'maxResults=40';
      
      const searchUrl = `${this.baseUrl}/search?part=snippet&q=${encodedQuery}&${typeParam}&${videoCategoryParam}&${maxResultsParam}&key=${this.apiKey}`;
      
      console.log('%c FINAL SEARCH URL:', 'background:green; color:white; font-size:14px', searchUrl);
      console.log('%c VERIFYING PARAMS:', 'background:green; color:white; font-size:14px', {
        'Has videoCategoryId=10': searchUrl.includes(videoCategoryParam),
        'Has type=video': searchUrl.includes(typeParam),
        'Has maxResults': searchUrl.includes(maxResultsParam),
        'Has API key': searchUrl.includes(this.apiKey)
      });


      const response = await fetch(searchUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log('SearchMusicVideos - No items returned from YouTube API');
        return [];
      }
      
      console.log('SearchMusicVideos - Raw API results count:', data.items.length);

      // Apply debugging info to original items before filtering
      data.items.forEach((video: any) => {
        // Pre-filter debug label
        video._originalTitle = video.snippet.title;
      });

      // Get the filter threshold - make sure it's properly initialized for React context
      let threshold = 5; // Default value set to 5 as requested
      try {
        const storedThreshold = localStorage.getItem('filterThreshold');
        if (storedThreshold !== null) {
          threshold = parseInt(storedThreshold, 2);
        } else {
          // Initialize it if it doesn't exist
          localStorage.setItem('filterThreshold', String(threshold));
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      console.log('🔍 USING FILTER THRESHOLD:', threshold);
      
      // Log the raw data before scoring to help debug
      console.log('RAW API RESPONSE:', data);
      console.log('Received', data.items?.length || 0, 'items from API');
      
      // Apply filtering (with visible debug info)
      const scoredVideos = this.scoreVideos(data.items, searchQuery);
      console.log('SCORED VIDEOS:', scoredVideos.map(v => ({ title: v.snippet.title, score: v.officialScore })));
      
      // Add debug info to show scoring
      scoredVideos.forEach((video: any) => {
        video.snippet.title = `[SCORE: ${video.officialScore || 0}] ${video._originalTitle}`;
      });
      
      // Apply filtering based on threshold - add extra debug info
      console.log('APPLYING FILTER WITH THRESHOLD:', threshold);
      
      const officialVideos = scoredVideos.filter((video: any) => {
        // Safe check for video and score
        if (!video || typeof video.officialScore === 'undefined') {
          console.log('Invalid video object or missing score:', video);
          return false;
        }
        
        // Explicitly log each video's score comparison
        const score = video.officialScore;
        const passesFilter = score > threshold;
        console.log(`Video "${video.snippet.title}" - Score: ${score} - Threshold: ${threshold} - Passes: ${passesFilter}`);
        
        // Debug: Mark which videos pass filter
        if (passesFilter) {
          video.snippet.title = `✅ [SCORE: ${score}] ${video._originalTitle}`;
        } else {
          video.snippet.title = `❌ [SCORE: ${score}] ${video._originalTitle}`;
        }
        
        return passesFilter;
      });
      
      console.log('SearchMusicVideos - After filtering, official videos count:', officialVideos.length, 'out of', scoredVideos.length);
      
      if (officialVideos.length > 0) {
        // Use the filtered videos (the ones that passed threshold)
        // Increased from 20 to 40 videos as requested
        const results = officialVideos.slice(0, 40).map(video => this.mapToSearchResult(video));
        console.log('SearchMusicVideos - Returning official videos:', results.length);
        return results;
      } else {
        // Fallback: display all videos if none pass the filter
        console.log('SearchMusicVideos - No official videos found, falling back to all results');
        // Still show the scores in the fallback results
        const results = scoredVideos.slice(0, 20).map((video: any) => this.mapToSearchResult(video));
        console.log('SearchMusicVideos - Returning fallback results:', results.length);
        return results;
      }

    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  // Define a type for the YouTube API search result item
  // Renamed function to better describe what it does - it scores videos but doesn't filter them
  private scoreVideos(videos: any[], originalQuery: string): any[] {
    // SIMPLE DEBUGGING
    console.log('BASIC DEBUG - Scoring started');
    console.log('BASIC DEBUG - Videos count:', videos?.length || 0);
    console.log('BASIC DEBUG - Query:', originalQuery);
    
    if (!videos || videos.length === 0) {
      return [];
    }
    
    const officialKeywords = [
      "official video", "official music video", " (omv)", "official audio", "official lyric video",
      "vevo", "official channel"
    ];
    const artistNameLikely = originalQuery.toLowerCase().split(" ")[0]; // Simple assumption

    return videos
      .map((video: any) => {
        let score = 0;
        const titleLower = video.snippet.title.toLowerCase();
        const channelTitleLower = video.snippet.channelTitle.toLowerCase();
        
        console.log('\n-----------------------------------');
        console.log(`Analyzing video: "${video.snippet.title}"`);
        console.log(`Channel: ${video.snippet.channelTitle}`);

        // 1. Check for VEVO in channel title (strong indicator)
        if (channelTitleLower.includes("vevo")) {
          score += 10;
          console.log('✅ VEVO in channel title: +10 points');
        } else {
          console.log('❌ No VEVO in channel title');
        }

        // 2. Check for "official" keywords in video title
        let foundOfficialKeyword = false;
        let keywordFound = '';
        
        for (const keyword of officialKeywords) {
          if (titleLower.includes(keyword)) {
            score += 5;
            foundOfficialKeyword = true;
            keywordFound = keyword;
            console.log(`✅ Official keyword found: "${keyword}": +5 points`);
            
            if (keyword.includes("video")) {
              score += 2;
              console.log('✅ Keyword contains "video": +2 additional points');
            }
            break; // Only score once for keyword presence in title
          }
        }
        
        if (!foundOfficialKeyword) {
          console.log('❌ No official keywords found in title');
        }

        // 3. Check if channel title contains "official" or the artist's name
        if (channelTitleLower.includes("official")) {
          score += 3;
          console.log('✅ "Official" in channel title: +3 points');
        } else {
          console.log('❌ No "official" in channel title');
        }
        
        if (channelTitleLower.includes(artistNameLikely) && originalQuery.length > 3) { // Avoid short queries triggering too easily
          score += 2;
          console.log(`✅ Artist name "${artistNameLikely}" in channel title: +2 points`);
        } else {
          console.log(`❌ Artist name "${artistNameLikely}" not in channel title or query too short`);
        }
        
        if (channelTitleLower.endsWith("music")) {
          score += 2;
          console.log('✅ Channel ends with "music": +2 points');
        } else {
          console.log('❌ Channel does not end with "music"');
        }

        // 4. Penalize if title contains "cover", "remix", "reaction", "live" (unless "official live")
        if (titleLower.includes("cover") || titleLower.includes("remix") || titleLower.includes("reaction")) {
          score -= 5;
          let penalty = '';
          if (titleLower.includes("cover")) penalty += '"cover" ';
          if (titleLower.includes("remix")) penalty += '"remix" ';
          if (titleLower.includes("reaction")) penalty += '"reaction" ';
          console.log(`⚠️ Penalized for having ${penalty}in title: -5 points`);
        }
        
        if (titleLower.includes("live") && !titleLower.includes("official live")) {
          score -= 3;
          console.log('⚠️ Penalized for "live" performance (not official): -3 points');
        }

        // 5. Penalize if title or channel contains keywords indicating non-music content
        if (
          titleLower.includes('nursery') ||
          titleLower.includes('rhymes') ||
          channelTitleLower.includes('kids') ||
          channelTitleLower.includes('children')
        ) {
          score -= 15;
          let reason = '';
          if (titleLower.includes('nursery')) reason += '"nursery" in title ';
          if (titleLower.includes('rhymes')) reason += '"rhymes" in title ';
          if (channelTitleLower.includes('kids')) reason += '"kids" in channel ';
          if (channelTitleLower.includes('children')) reason += '"children" in channel ';
          console.log(`⚠️ Heavy penalty for children's content (${reason.trim()}): -15 points`);
        }

        // Attach the score to the video object
        (video as any).officialScore = score;
        console.log(`FINAL SCORE for "${video.snippet.title}": ${score} points`);
        console.log('-----------------------------------');
        return video;
      })
      // No filtering here - we're just scoring and sorting
      // The actual filtering happens in the searchMusicVideos method
      .sort((a: any, b: any) => {
        const scoreA = a.officialScore ?? 0;
        const scoreB = b.officialScore ?? 0;
        return scoreB - scoreA;
      })
      // Sort by score, highest first
      .sort((a: any, b: any) => {
        const scoreA = a.officialScore ?? 0;
        const scoreB = b.officialScore ?? 0;
        return scoreB - scoreA;
      });
  }

  private mapToSearchResult(item: { id: { videoId: string }, snippet: { title: string, channelTitle: string, thumbnails?: { medium?: { url: string }, default?: { url: string } } } }): SearchResult {
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
    };
  }
}

// Create and export a singleton instance
export const searchService = new SearchService(import.meta.env.VITE_YOUTUBE_API_KEY || '');
