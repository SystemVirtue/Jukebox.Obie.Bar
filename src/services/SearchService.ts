import { YouTubeConfig } from '../config/youtube.config';

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
    try {
      const searchQuery = query.trim();
      if (!searchQuery) {
        return [];
      }

      // Step 1: Search YouTube for videos in Category 10 (Music)
      // We request more results initially to have a larger pool for client-side filtering.
      const searchUrl = `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=10&maxResults=50&key=${this.apiKey}`;

      console.log('[YTJukeBox DEBUG] YouTube API request URL:', searchUrl);
      const response = await fetch(searchUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        console.log('[YTJukeBox DEBUG] First 3 raw YouTube results:', JSON.stringify(data.items.slice(0,3), null, 2));
      }
      
      if (!data.items || data.items.length === 0) {
        console.log('[YTJukeBox DEBUG] No items returned from YouTube API.');
        return [];
      }

      const officialVideos = this.filterForOfficial(data.items, searchQuery);
      if (officialVideos.length > 0) {
        return officialVideos.slice(0, 20).map(video => this.mapToSearchResult(video));
      } else {
        // Fallback: display general music results if no "official" ones are strongly identified
        return data.items.slice(0, 20).map(video => this.mapToSearchResult(video));
      }

    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  // Define a type for the YouTube API search result item
  private filterForOfficial(videos: any[], originalQuery: string): any[] {
    const officialKeywords = [
      "official video", "official music video", " (omv)", "official audio", "official lyric video",
      "vevo", "official channel"
    ];
    const artistNameLikely = originalQuery.toLowerCase().split(" ")[0]; // Simple assumption

    return videos
      .map(video => {
        let score = 0;
        const titleLower = video.snippet.title.toLowerCase();
        const channelTitleLower = video.snippet.channelTitle.toLowerCase();

        // 1. Check for VEVO in channel title (strong indicator)
        if (channelTitleLower.includes("vevo")) {
          score += 10;
        }

        // 2. Check for "official" keywords in video title
        for (const keyword of officialKeywords) {
          if (titleLower.includes(keyword)) {
            score += 5;
            if (keyword.includes("video")) score += 2; // Prioritize actual "video"
            break; // Only score once for keyword presence in title
          }
        }

        // 3. Check if channel title contains "official" or the artist's name
        if (channelTitleLower.includes("official")) {
          score += 3;
        }
        if (channelTitleLower.includes(artistNameLikely) && originalQuery.length > 3) { // Avoid short queries triggering too easily
          score += 2;
        }
        if (channelTitleLower.endsWith("music")) {
          score += 2;
        }

        // 4. Penalize if title contains "cover", "remix", "reaction", "live" (unless "official live")
        if (titleLower.includes("cover") || titleLower.includes("remix") || titleLower.includes("reaction")) {
          score -= 5;
        }
        if (titleLower.includes("live") && !titleLower.includes("official live")) {
          score -= 3;
        }

        // 5. Penalize if title or channel contains keywords indicating non-music content
        if (
          titleLower.includes('nursery') ||
          titleLower.includes('rhymes') ||
          channelTitleLower.includes('kids') ||
          channelTitleLower.includes('children')
        ) {
          score -= 15;
        }

            const result = this.mapToSearchResult(video);
            result.officialScore = score;
            return result;
        })
        // Ensure we only keep videos with positive scores
        .filter(video => video.officialScore !== undefined && video.officialScore > 0)
        // Sort by score, highest first
        .sort((a, b) => {
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
