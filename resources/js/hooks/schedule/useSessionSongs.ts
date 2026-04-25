import { useCallback } from 'react';
import type { Song } from '@/types';
import type { DraftSession } from '@/lib/sessionUtils';
import {
    addSongToSession,
    removeSongFromSession,
    reorderSongsInSession,
    isSongInSession,
    resolveSameAs,
} from '@/lib/sessionUtils';

interface UseSessionSongsOptions {
    sessions:            DraftSession[];
    updateSessionSongs:  (key: string, updater: (s: DraftSession) => DraftSession) => void;
}

export function useSessionSongs({ sessions, updateSessionSongs }: UseSessionSongsOptions) {

    // ── Add ───────────────────────────────────────────────────────────────────

    const addSong = useCallback((sessionKey: string, song: Song) => {
        const session = sessions.find((s) => s._key === sessionKey);
        if (!session) return;
        if (isSongInSession(session, song.id)) return;

        // Cast Song → SessionSong dengan pivot default
        const sessionSong = {
            ...song,
            pivot: { order: session.songs.length, notes: null },
        };

        updateSessionSongs(sessionKey, (s) => addSongToSession(s, sessionSong));
    }, [sessions, updateSessionSongs]);

    // ── Remove ────────────────────────────────────────────────────────────────

    const removeSong = useCallback((sessionKey: string, songId: number) => {
        updateSessionSongs(sessionKey, (s) => removeSongFromSession(s, songId));
    }, [updateSessionSongs]);

    // ── Reorder ───────────────────────────────────────────────────────────────

    const reorderSongs = useCallback((
        sessionKey: string,
        fromIndex:  number,
        toIndex:    number,
    ) => {
        updateSessionSongs(sessionKey, (s) => reorderSongsInSession(s, fromIndex, toIndex));
    }, [updateSessionSongs]);

    // ── Check ─────────────────────────────────────────────────────────────────

    const isSongAdded = useCallback((sessionKey: string, songId: number): boolean => {
        const session = sessions.find((s) => s._key === sessionKey);
        if (!session) return false;
        return isSongInSession(session, songId);
    }, [sessions]);

    // ── Apply same-as ─────────────────────────────────────────────────────────

    const applySameAs = useCallback((sessionKey: string, targetKey: string) => {
        const songs = resolveSameAs(sessions, targetKey);
        updateSessionSongs(sessionKey, (s) => ({
            ...s,
            songs,
            same_as_key: targetKey,
        }));
    }, [sessions, updateSessionSongs]);

    // ── Clear same-as ─────────────────────────────────────────────────────────

    const clearSameAs = useCallback((sessionKey: string) => {
        updateSessionSongs(sessionKey, (s) => ({
            ...s,
            same_as_key: null,
        }));
    }, [updateSessionSongs]);

    return {
        addSong,
        removeSong,
        reorderSongs,
        isSongAdded,
        applySameAs,
        clearSameAs,
    };
}