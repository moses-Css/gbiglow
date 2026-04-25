import { useCallback, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import type { Song } from '@/types';
import { bulkDestroy } from '@/routes/songs';

interface UseSongSelectionOptions {
    songs:   Song[];
    flash:   (message: string) => void;
    isAdmin: boolean;
}

export function useSongSelection({ songs, flash, isAdmin }: UseSongSelectionOptions) {
    const [selectedIds, setSelectedIds]         = useState<Set<number>>(new Set());
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [mobileSelectMode, setMobileSelectMode] = useState(false);

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds((prev) =>
            prev.size === songs.length
                ? new Set()
                : new Set(songs.map((s) => s.id))
        );
    }, [songs]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setMobileSelectMode(false);
    }, []);

    const confirmBulkDelete = useCallback(() => {
        router.delete(bulkDestroy().url, {
            data:           { ids: Array.from(selectedIds) },
            preserveScroll: true,
            only:           ['songs'],
            onSuccess: () => {
                flash(`${selectedIds.size} song${selectedIds.size > 1 ? 's' : ''} deleted.`);
                clearSelection();
                setBulkDeleteDialog(false);
            },
        });
    }, [selectedIds, flash, clearSelection]);

    const handleLongPress = useCallback((song: Song) => {
        if (!isAdmin) return;
        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(40);
            setMobileSelectMode(true);
            setSelectedIds(new Set([song.id]));
        }, 500);
    }, [isAdmin]);

    const cancelLongPress = useCallback(() => {
        clearTimeout(longPressTimer.current);
    }, []);

    const handleMobileCardTap = useCallback((song: Song, onOpenDetail: (song: Song) => void) => {
        if (mobileSelectMode) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.has(song.id) ? next.delete(song.id) : next.add(song.id);
                if (next.size === 0) setMobileSelectMode(false);
                return next;
            });
        } else {
            onOpenDetail(song);
        }
    }, [mobileSelectMode]);

    return {
        // State
        selectedIds,
        bulkDeleteDialog,
        setBulkDeleteDialog,
        mobileSelectMode,

        // Actions
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        confirmBulkDelete,
        handleLongPress,
        cancelLongPress,
        handleMobileCardTap,
    };
}