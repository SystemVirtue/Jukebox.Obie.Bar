import React from 'react';
import { SearchResult } from '../services/SearchService';
import './SearchResults.css';
interface SearchResultsProps {
    results: SearchResult[];
    onSelect: (videoId: string) => void;
    isLoading: boolean;
    error?: string | null;
}
export declare const SearchResults: React.FC<SearchResultsProps>;
export {};
//# sourceMappingURL=SearchResults.d.ts.map