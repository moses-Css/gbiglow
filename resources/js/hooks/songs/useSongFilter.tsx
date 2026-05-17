import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { index as songsIndex } from '@/routes/songs';

interface Filters {
    search?: string;
    folder?: string;
    status?: string;
}

import { Song } from '@/types';

export function useSongFilter(initialFilters: Filters, songsData: Song[]) { // ← tambah songsData param
    const filtersRef = useRef(initialFilters);
    useEffect(() => { filtersRef.current = initialFilters; }, [initialFilters]);

    const [search, setSearch]           = useState(initialFilters.search ?? '');
    const [localSearch, setLocalSearch] = useState(initialFilters.search ?? '');
    const [localFolder, setLocalFolder] = useState(initialFilters.folder ?? 'all');
    const [localStatus, setLocalStatus] = useState(initialFilters.status ?? 'all');
    const [isSearching, setIsSearching] = useState(false);

    const filterDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const baseDataRef    = useRef<Song[]>(songsData); // ← snapshot sebelum search

    const applyFilters = useCallback((overrides: Partial<Filters>) => {
        clearTimeout(filterDebounce.current);
        filterDebounce.current = setTimeout(() => {
            const params = Object.fromEntries(
                Object.entries({ ...filtersRef.current, ...overrides })
                    .map(([k, v]) => [k, v === '' ? undefined : v])
            );
            router.get(songsIndex(), params, {
                preserveState: true,
                replace:       true,
                only:          ['songs', 'filters'],
                onFinish:      () => setIsSearching(false),
            });
        }, 400);
    }, []);

    const handleSearchChange = useCallback((val: string) => {
        setSearch(val);
        setLocalSearch(val);

        const trimmed = val.trim();
        if (trimmed !== (filtersRef.current.search ?? '')) {
            setIsSearching(true);
        }

        applyFilters({ search: trimmed || undefined });
    }, [applyFilters]);

    const handleSearchClear = useCallback(() => {
        setSearch('');
        setLocalSearch('');
        setIsSearching(true);
        clearTimeout(searchDebounce.current);
        applyFilters({ search: undefined });
    }, [applyFilters]);

    const handleFolderChange = useCallback((val: string) => {
        setLocalFolder(val);
        applyFilters({ folder: val === 'all' ? '' : val });
    }, [applyFilters]);

    const handleStatusChange = useCallback((val: string) => {
        setLocalStatus(val);
        applyFilters({ status: val === 'all' ? '' : val });
    }, [applyFilters]);

    const handleReset = useCallback(() => {
        setSearch('');
        setLocalSearch('');
        setLocalFolder('all');
        setLocalStatus('all');
        applyFilters({ folder: undefined, status: undefined, search: undefined });
    }, [applyFilters]);

    const displayedSongs = useMemo(() => {
        const q = localSearch.trim().toLowerCase();

        if (!q) {
            if (isSearching) {
                // Clear was clicked, waiting for server — show snapshot
                return baseDataRef.current;
            }
            // No active search, server responded — safe to update snapshot
            baseDataRef.current = songsData;
            return songsData;
        }

        if (isSearching) {
            return baseDataRef.current;
        }

        return songsData.filter((s) =>
            s.title.toLowerCase().includes(q) ||
            (s.publisher ?? '').toLowerCase().includes(q)
        );
    }, [songsData, localSearch, isSearching]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filtersRef.current.folder) count++;
        if (filtersRef.current.status) count++;
        return count;
    }, [initialFilters.folder, initialFilters.status]);

    return {
        // State
        search,
        localSearch,
        isSearching,
        localFolder,
        localStatus,
        activeFilterCount,
        displayedSongs, // ← expose dari hook

        // Handlers
        handleSearchChange,
        handleSearchClear,
        handleFolderChange,
        handleStatusChange,
        handleReset,
    };
}