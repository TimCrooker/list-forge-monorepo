import { useMemo, useState, useCallback } from 'react';
import type { LifecycleStatus, ItemSource } from '@listforge/core-types';

export interface ItemFilters {
  lifecycleTab: string;
  sourceFilter: string;
  searchQuery: string;
  sortOption: string;
}

export interface UseItemFiltersReturn {
  // Filter state
  filters: ItemFilters;
  lifecycleTab: string;
  sourceFilter: string;
  searchQuery: string;
  searchInput: string;
  sortOption: string;

  // Filter setters
  setLifecycleTab: (tab: string) => void;
  setSourceFilter: (source: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchInput: (input: string) => void;
  setSortOption: (option: string) => void;
  handleSearchChange: (value: string) => void;

  // Derived filters for API
  lifecycleFilter: LifecycleStatus[];
  sourceFilterArray: ItemSource[];
  sortBy: string;
  sortOrder: string;
}

/**
 * Custom hook for managing item list filters
 *
 * @param initialFilters - Optional initial filter values
 * @returns Filter state and handlers
 *
 * @example
 * ```tsx
 * const filters = useItemFilters({
 *   lifecycleTab: 'inventory',
 *   sourceFilter: 'all',
 *   searchQuery: '',
 *   sortOption: 'newest',
 * });
 *
 * // Use in API query
 * const { data } = useListItemsQuery({
 *   lifecycleStatus: filters.lifecycleFilter,
 *   source: filters.sourceFilterArray,
 *   search: filters.searchQuery,
 *   sortBy: filters.sortBy,
 *   sortOrder: filters.sortOrder,
 * });
 * ```
 */
export function useItemFilters(
  initialFilters?: Partial<ItemFilters>
): UseItemFiltersReturn {
  const [lifecycleTab, setLifecycleTab] = useState(
    initialFilters?.lifecycleTab || 'inventory'
  );
  const [sourceFilter, setSourceFilter] = useState(
    initialFilters?.sourceFilter || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(
    initialFilters?.searchQuery || ''
  );
  const [searchInput, setSearchInput] = useState('');
  const [sortOption, setSortOption] = useState(
    initialFilters?.sortOption || 'newest'
  );

  // Derive lifecycle status filter from tab
  const lifecycleFilter = useMemo((): LifecycleStatus[] => {
    switch (lifecycleTab) {
      case 'all':
        return [];
      case 'draft':
        return ['draft'];
      case 'inventory':
        return ['ready', 'listed'];
      case 'ready':
        return ['ready'];
      case 'listed':
        return ['listed'];
      case 'sold':
        return ['sold'];
      case 'archived':
        return ['archived'];
      default:
        return ['ready', 'listed'];
    }
  }, [lifecycleTab]);

  // Derive source filter
  const sourceFilterArray = useMemo((): ItemSource[] => {
    switch (sourceFilter) {
      case 'ai_capture':
        return ['ai_capture'];
      case 'manual':
        return ['manual'];
      default:
        return [];
    }
  }, [sourceFilter]);

  // Derive sort parameters
  const { sortBy, sortOrder } = useMemo(() => {
    switch (sortOption) {
      case 'newest':
        return { sortBy: 'createdAt', sortOrder: 'desc' };
      case 'oldest':
        return { sortBy: 'createdAt', sortOrder: 'asc' };
      case 'price-high':
        return { sortBy: 'defaultPrice', sortOrder: 'desc' };
      case 'price-low':
        return { sortBy: 'defaultPrice', sortOrder: 'asc' };
      case 'title-az':
        return { sortBy: 'title', sortOrder: 'asc' };
      case 'title-za':
        return { sortBy: 'title', sortOrder: 'desc' };
      default:
        return { sortBy: 'createdAt', sortOrder: 'desc' };
    }
  }, [sortOption]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // Simple debounce: update search query after a delay
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return {
    // Filter state
    filters: {
      lifecycleTab,
      sourceFilter,
      searchQuery,
      sortOption,
    },
    lifecycleTab,
    sourceFilter,
    searchQuery,
    searchInput,
    sortOption,

    // Filter setters
    setLifecycleTab,
    setSourceFilter,
    setSearchQuery,
    setSearchInput,
    setSortOption,
    handleSearchChange,

    // Derived filters
    lifecycleFilter,
    sourceFilterArray,
    sortBy,
    sortOrder,
  };
}
