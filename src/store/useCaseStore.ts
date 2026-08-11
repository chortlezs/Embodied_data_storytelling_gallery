import { create } from 'zustand';
import { Case, Taxonomy } from '../types';
import caseData from '../data/data.json';

interface CaseState {
  cases: Case[];
  taxonomy: Taxonomy;
  selectedTags: Record<string, string[]>; // subGroup -> tags
  searchQuery: string;
  selectedCase: Case | null;
  
  // Actions
  toggleTag: (subGroup: string, tag: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCase: (caseItem: Case | null) => void;
  resetFilters: () => void;
  
  // Selectors
  getFilteredCases: () => Case[];
}

const typedCaseData = caseData as { cases: Case[]; taxonomy: Taxonomy };

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: typedCaseData.cases,
  taxonomy: typedCaseData.taxonomy,
  selectedTags: {},
  searchQuery: '',
  selectedCase: null,

  toggleTag: (subGroup, tag) => set((state) => {
    const currentTags = state.selectedTags[subGroup] || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    
    return {
      selectedTags: {
        ...state.selectedTags,
        [subGroup]: newTags,
      },
    };
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedCase: (caseItem) => set({ selectedCase: caseItem }),

  resetFilters: () => set({ selectedTags: {}, searchQuery: '' }),

  getFilteredCases: () => {
    const { cases, selectedTags, searchQuery } = get();
    
    return cases.filter((c) => {
      // Search filter
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.venue.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Tags filter (AND logic across subGroups, OR logic within subGroup)
      return Object.entries(selectedTags).every(([subGroup, tags]) => {
        if (tags.length === 0) return true;
        
        // Find which mainCategory this subGroup belongs to
        let found = false;
        for (const mainCat of Object.values(c.tags)) {
          if (mainCat[subGroup]) {
            found = mainCat[subGroup].some(t => tags.includes(t));
            if (found) break;
          }
        }
        return found;
      });
    });
  },
}));
