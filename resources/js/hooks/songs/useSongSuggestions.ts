import { useCallback, useRef, useState } from 'react';
import { suggestions as suggestionsRoute } from '@/routes/songs';

export function useSongSuggestions() {
    const [titleSuggestions, setTitleSuggestions]         = useState<string[]>([]);
    const [publisherSuggestions, setPublisherSuggestions] = useState<string[]>([]);
    const [loadingField, setLoadingField]                 = useState<'title' | 'publisher' | null>(null);

    const titleDebounce     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const publisherDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const suggestionsCache  = useRef<Record<string, string[]>>({});

    const fetchSuggestions = useCallback((
        field:  'title' | 'publisher',
        value:  string,
        setter: (v: string[]) => void,
    ) => {
        if (field === 'title') clearTimeout(titleDebounce.current);
        else                   clearTimeout(publisherDebounce.current);

        if (value.length < 2) { setter([]); setLoadingField(null); return; }

        const cacheKey = `${field}:${value.toLowerCase()}`;
        if (suggestionsCache.current[cacheKey]) {
            setter(suggestionsCache.current[cacheKey]);
            setLoadingField(null);
            return;
        }

        setLoadingField(field);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${suggestionsRoute.url()}?field=${field}&q=${encodeURIComponent(value)}`);
                const result = await res.json();
                suggestionsCache.current[cacheKey] = result;
                setter(result);
            } finally {
                setLoadingField(null);
            }
        }, 150);

        if (field === 'title') titleDebounce.current     = timer;
        else                   publisherDebounce.current = timer;
    }, []);

    const resetSuggestions = useCallback(() => {
        setTitleSuggestions([]);
        setPublisherSuggestions([]);
        setLoadingField(null);
        suggestionsCache.current = {};
    }, []);

    return {
        titleSuggestions,
        setTitleSuggestions,
        publisherSuggestions,
        setPublisherSuggestions,
        loadingField,
        fetchSuggestions,
        resetSuggestions,
    };
}