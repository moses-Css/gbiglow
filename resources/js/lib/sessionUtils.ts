import type { ScheduleSession, SessionSong, ScheduleType } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DraftSession {
    _key:        string; // local unique key, tidak dikirim ke server
    id?:         number; // ada kalau sudah tersimpan di DB
    label:       string;
    order:       number;
    songs:       SessionSong[];
    same_as_key: string | null; // _key dari session referensi
}

// ── Session transform ─────────────────────────────────────────────────────────

export function hydrateSessions(sessions: ScheduleSession[]): DraftSession[] {
    return sessions.map((s) => ({
        _key:        String(s.id),
        id:          s.id,
        label:       s.label,
        order:       s.order,
        songs:       s.songs,
        same_as_key: null,
    }));
}

export function createDraftSession(order: number): DraftSession {
    return {
        _key:        `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label:       `Session ${order + 1}`,
        order,
        songs:       [],
        same_as_key: null,
    };
}

// ── Session reorder ───────────────────────────────────────────────────────────

export function reorderSessions(
    sessions: DraftSession[],
    fromIndex: number,
    toIndex:   number,
): DraftSession[] {
    const next = [...sessions];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next.map((s, i) => ({ ...s, order: i }));
}

// ── Same-as logic ─────────────────────────────────────────────────────────────

export function resolveSameAs(
    sessions:   DraftSession[],
    targetKey:  string,
): SessionSong[] {
    const target = sessions.find((s) => s._key === targetKey);
    return target ? [...target.songs] : [];
}

export function resolveOrphanedSameAs(sessions: DraftSession[]): DraftSession[] {
    const validKeys = new Set(sessions.map((s) => s._key));
    return sessions.map((s) => ({
        ...s,
        same_as_key: s.same_as_key && validKeys.has(s.same_as_key)
            ? s.same_as_key
            : null,
    }));
}

// ── Song helpers ──────────────────────────────────────────────────────────────

export function isSongInSession(session: DraftSession, songId: number): boolean {
    return session.songs.some((s) => s.id === songId);
}

export function addSongToSession(
    session: DraftSession,
    song:    SessionSong,
): DraftSession {
    if (isSongInSession(session, song.id)) return session;
    return {
        ...session,
        songs: [
            ...session.songs,
            { ...song, pivot: { order: session.songs.length, notes: null } },
        ],
    };
}

export function removeSongFromSession(
    session: DraftSession,
    songId:  number,
): DraftSession {
    return {
        ...session,
        songs: session.songs
            .filter((s) => s.id !== songId)
            .map((s, i) => ({ ...s, pivot: { ...s.pivot, order: i } })),
    };
}

export function reorderSongsInSession(
    session:   DraftSession,
    fromIndex: number,
    toIndex:   number,
): DraftSession {
    const next = [...session.songs];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return {
        ...session,
        songs: next.map((s, i) => ({ ...s, pivot: { ...s.pivot, order: i } })),
    };
}

// ── Validation ────────────────────────────────────────────────────────────────

export function getEmptySessions(sessions: DraftSession[]): string[] {
    return sessions
        .filter((s) => s.songs.length === 0)
        .map((s) => s._key);
}

export function isScheduleValid(
    sessions: DraftSession[],
    type:     ScheduleType,
): boolean {
    if (type === 'regular') return sessions[0]?.songs.length > 0;
    return sessions.every((s) => s.songs.length > 0);
}

// ── Serialize for API ─────────────────────────────────────────────────────────

export function serializeSessions(sessions: DraftSession[]): {
    id?: number;
    label: string;
    songs: { id: number; order: number; notes: string | null }[];
}[] {
    return sessions.map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        label: s.label,
        songs: s.songs.map((song) => ({
            id:    song.id,
            order: song.pivot.order,
            notes: song.pivot.notes,
        })),
    }));
}

// ── Dirty check ───────────────────────────────────────────────────────────────

export function isSessionDirty(
    draft:    DraftSession,
    original: ScheduleSession,
): boolean {
    if (draft.label !== original.label) return true;
    if (draft.songs.length !== original.songs.length) return true;

    return draft.songs.some((song, i) => {
        const orig = original.songs[i];
        return !orig ||
            song.id !== orig.id ||
            song.pivot.order !== orig.pivot.order ||
            song.pivot.notes !== orig.pivot.notes;
    });
}

export function getScheduleDirtyState(
    drafts:    DraftSession[],
    originals: ScheduleSession[],
): { isDirty: boolean; dirtyKeys: Set<string> } {
    const originalMap = new Map(originals.map((s) => [String(s.id), s]));
    const dirtyKeys   = new Set<string>();

    for (const draft of drafts) {
        const original = draft.id ? originalMap.get(String(draft.id)) : null;
        if (!original || isSessionDirty(draft, original)) {
            dirtyKeys.add(draft._key);
        }
    }

    // Session baru yang belum punya id otomatis dirty
    if (drafts.length !== originals.length) {
        drafts
            .filter((d) => !d.id)
            .forEach((d) => dirtyKeys.add(d._key));
    }

    return { isDirty: dirtyKeys.size > 0, dirtyKeys };
}