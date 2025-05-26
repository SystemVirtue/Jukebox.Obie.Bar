export interface SearchResult {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    officialScore?: number;
}
export declare class SearchService {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(apiKey: string);
    searchMusicVideos(query: string): Promise<SearchResult[]>;
    private filterForOfficial;
    private mapToSearchResult;
}
export declare const searchService: SearchService;
//# sourceMappingURL=SearchService.d.ts.map