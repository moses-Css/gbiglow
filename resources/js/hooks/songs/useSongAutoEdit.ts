import { useEffect } from 'react';
import type { Song } from '@/types';

export function useSongAutoEdit(
    editSong: Song | null | undefined,
    openEdit: (song: Song) => void,
) {
    useEffect(() => {
        if (!editSong) return;
        openEdit(editSong);
        window.history.replaceState({}, '', window.location.pathname);
    }, []);
}