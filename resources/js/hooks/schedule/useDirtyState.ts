import { useMemo, useRef } from 'react';
import type { Schedule, ScheduleSession } from '@/types';
import type { DraftSession } from '@/lib/sessionUtils';
import { getScheduleDirtyState } from '@/lib/sessionUtils';

interface UseDirtyStateOptions {
    schedule:          Schedule;
    sessions:          DraftSession[];
    scheduleDraft:     Partial<Schedule>;
    forceInitialDirty?: boolean;
}

export function useDirtyState({
    schedule,
    sessions,
    scheduleDraft,
    forceInitialDirty = false,
}: UseDirtyStateOptions) {
    // Snapshot original sessions saat pertama mount
    const originalSessions = useRef<ScheduleSession[]>(schedule.sessions ?? []);

    const { isDirty, dirtyKeys } = useMemo(() => {
        return getScheduleDirtyState(sessions, originalSessions.current);
    }, [sessions]);

    // Check apakah metadata schedule berubah
    const isMetaDirty = useMemo(() => {
        return (
            scheduleDraft.event_name    !== schedule.event_name    ||
            scheduleDraft.event_date    !== schedule.event_date    ||
            scheduleDraft.category      !== schedule.category      ||
            scheduleDraft.type          !== schedule.type          ||
            scheduleDraft.color_primary !== schedule.color_primary ||
            scheduleDraft.color_secondary !== schedule.color_secondary ||
            scheduleDraft.notes         !== schedule.notes         ||
            scheduleDraft.is_published  !== schedule.is_published
        );
    }, [scheduleDraft, schedule]);

    const hasUnsavedChanges = isDirty || isMetaDirty || forceInitialDirty;

    const resetSnapshot = (freshSessions: ScheduleSession[]) => {
        originalSessions.current = freshSessions;
    };

    return {
        isDirty,
        isMetaDirty,
        hasUnsavedChanges,
        dirtyKeys,
        resetSnapshot,
    };
}