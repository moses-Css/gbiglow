import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { index as songsIndex } from '@/routes/songs';

interface Filters {
    search?: string;
    folder?: string;
    status?: string;
}

export function useSongFilter(initialFilters: Filters) {
    const filtersRef = useRef(initialFilters);
    useEffect(() => { filtersRef.current = initialFilters; }, [initialFilters]);

    const [search, setSearch]           = useState(initialFilters.search ?? '');
    const [localSearch, setLocalSearch] = useState(initialFilters.search ?? '');
    const [localFolder, setLocalFolder] = useState(initialFilters.folder ?? 'all');
    const [localStatus, setLocalStatus] = useState(initialFilters.status ?? 'all');

    const filterDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
            });
        }, 400);
    }, []);

    const handleSearchChange = useCallback((val: string) => {
        setSearch(val);
        setLocalSearch(val);
        clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => {
            applyFilters({ search: val.trim() || undefined });
        }, 300);
    }, [applyFilters]);

    const handleSearchClear = useCallback(() => {
        setSearch('');
        setLocalSearch('');
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
        localFolder,
        localStatus,
        activeFilterCount,

        // Handlers
        handleSearchChange,
        handleSearchClear,
        handleFolderChange,
        handleStatusChange,
        handleReset,
    };
}