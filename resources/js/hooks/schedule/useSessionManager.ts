import { useCallback, useState } from 'react';
import type { ScheduleSession } from '@/types';
import type { DraftSession } from '@/lib/sessionUtils';
import {
    hydrateSessions,
    createDraftSession,
    reorderSessions,
    resolveOrphanedSameAs,
} from '@/lib/sessionUtils';

export function useSessionManager(initialSessions: ScheduleSession[]) {
    const [sessions, setSessions] = useState<DraftSession[]>(
        () => hydrateSessions(initialSessions)
    );

    // ── Add ───────────────────────────────────────────────────────────────────

    const addSession = useCallback(() => {
        setSessions((prev) => [
            ...prev,
            createDraftSession(prev.length),
        ]);
    }, []);

    // ── Remove ────────────────────────────────────────────────────────────────

    const removeSession = useCallback((key: string) => {
        setSessions((prev) => {
            const filtered = prev.filter((s) => s._key !== key);
            const reordered = filtered.map((s, i) => ({ ...s, order: i }));
            return resolveOrphanedSameAs(reordered);
        });
    }, []);

    // ── Reorder ───────────────────────────────────────────────────────────────

    const reorderSession = useCallback((fromIndex: number, toIndex: number) => {
        setSessions((prev) => reorderSessions(prev, fromIndex, toIndex));
    }, []);

    // ── Same-as ───────────────────────────────────────────────────────────────

    const setSameAs = useCallback((sessionKey: string, targetKey: string | null) => {
        setSessions((prev) => prev.map((s) =>
            s._key === sessionKey
                ? { ...s, same_as_key: targetKey }
                : s
        ));
    }, []);

    // ── Update songs in session (called by useSessionSongs) ───────────────────

    const updateSessionSongs = useCallback((
        sessionKey: string,
        updater: (session: DraftSession) => DraftSession,
    ) => {
        setSessions((prev) => prev.map((s) =>
            s._key === sessionKey ? updater(s) : s
        ));
    }, []);

    // ── Update label ──────────────────────────────────────────────────────────

    const updateSessionLabel = useCallback((sessionKey: string, label: string) => {
        setSessions((prev) => prev.map((s) =>
            s._key === sessionKey ? { ...s, label } : s
        ));
    }, []);

    // ── Reset (after save) ────────────────────────────────────────────────────

    const resetSessions = useCallback((fresh: ScheduleSession[]) => {
        setSessions(hydrateSessions(fresh));
    }, []);

    return {
        sessions,
        addSession,
        removeSession,
        reorderSession,
        setSameAs,
        updateSessionSongs,
        updateSessionLabel,
        resetSessions,
    };
}