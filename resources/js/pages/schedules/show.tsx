import { useCallback, useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus } from 'lucide-react';
import ScheduleHeader from '@/components/schedule/ScheduleHeader';
import ScheduleSkeleton from '@/components/schedule/ScheduleSkeleton';
import SessionBlock from '@/components/schedule/SessionBlock';
import { useSessionManager } from '@/hooks/schedule/useSessionManager';
import { useSessionSongs } from '@/hooks/schedule/useSessionSongs';
import { useDirtyState } from '@/hooks/schedule/useDirtyState';
import { useFlash } from '@/components/flash-toast';
import { getEmptySessions, serializeSessions } from '@/lib/sessionUtils';
import { update, index as schedulesIndex } from '@/routes/schedules';
import type { Schedule, Song } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    schedule: Schedule;
    allSongs: Song[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScheduleShow({ schedule, allSongs }: Props) {
    const { flash } = useFlash();

    const [saving, setSaving]               = useState(false);
    const [unsavedDialog, setUnsavedDialog] = useState(false);
    const [savedAt, setSavedAt]             = useState<number | null>(null);
    const [savedRecently, setSavedRecently] = useState(false);
    const [emptySessionKeys, setEmptySessionKeys] = useState<string[]>([]);
    const pendingNavRef                     = useRef<(() => void) | null>(null);
    const sessionRefs                       = useRef<Record<string, HTMLDivElement | null>>({});

    // ── Session hooks ─────────────────────────────────────────────────────────

    const {
        sessions,
        addSession,
        removeSession,
        updateSessionSongs,
        resetSessions,
    } = useSessionManager(schedule.sessions ?? []);

    const {
        addSong,
        removeSong,
        reorderSongs,
        isSongAdded,
        applySameAs,
        clearSameAs,
    } = useSessionSongs({ sessions, updateSessionSongs });

    const { hasUnsavedChanges, dirtyKeys, resetSnapshot } = useDirtyState({
        schedule,
        sessions,
        scheduleDraft: schedule,
        forceInitialDirty: !!schedule.copied_from_id,
    });

    // ── Reset after save ──────────────────────────────────────────────────────

    useEffect(() => {
        if (savedAt === null) return;
        resetSnapshot(schedule.sessions ?? []);
        resetSessions(schedule.sessions ?? []);
    }, [savedAt]);

    // ── Navigation guard ──────────────────────────────────────────────────────

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleBack = useCallback(() => {
        if (hasUnsavedChanges) {
            pendingNavRef.current = () => router.get(schedulesIndex().url);
            setUnsavedDialog(true);
        } else {
            router.get(schedulesIndex().url);
        }
    }, [hasUnsavedChanges]);

    const handleSave = useCallback(() => {
        const emptySessions = getEmptySessions(sessions);
        if (emptySessions.length > 0) {
            setEmptySessionKeys(emptySessions);
            flash('Add at least one song to each session before saving.');
            // Scroll to first empty session
            const firstKey = emptySessions[0];
            sessionRefs.current[firstKey]?.scrollIntoView({
                behavior: 'smooth',
                block:    'center',
            });
            return;
        }
        setEmptySessionKeys([]);

        setSaving(true);
        router.put(
            update(schedule.id).url,
            {
                event_name: schedule.event_name,
                event_date: schedule.event_date,
                category:   schedule.category,
                sessions: serializeSessions(sessions),
            },
            {
                preserveScroll: true,
                only:           ['schedule'],
                onSuccess: () => {
                    setSaving(false);
                    setSavedAt(Date.now());
                    setSavedRecently(true);
                    setTimeout(() => setSavedRecently(false), 3000);
                },
                onError: () => {
                    setSaving(false);
                    flash('Failed to save. Please try again.');
                },
            },
        );
    }, [sessions, schedule, flash]);

    const handleTogglePublish = useCallback(() => {
        router.put(
            update(schedule.id).url,
            {
                event_name:   schedule.event_name,
                event_date:   schedule.event_date,
                category:     schedule.category,
                is_published: !schedule.is_published,
            },
            {
                preserveScroll: true,
                only: ['schedule'],
                onSuccess: () => flash(
                    schedule.is_published
                        ? 'Schedule unpublished.'
                        : 'Schedule published successfully.'
                ),
            },
        );
    }, [schedule, flash]);

    const isMultiSession = schedule.type === 'multi_session';

    // ── Render ────────────────────────────────────────────────────────────────

    if (!schedule.sessions?.length) return (
        <AppLayout>
            <div className="mx-auto max-w-2xl p-4 md:p-6">
                <ScheduleSkeleton />
            </div>
        </AppLayout>
    );

    return (
        <AppLayout>
            <Head title={schedule.event_name} />
            <div className="max-w-2xl flex flex-col gap-6 p-4 md:p-6 pb-28">

                {/* Header */}
                <ScheduleHeader
                    schedule={schedule}
                    hasUnsavedChanges={hasUnsavedChanges}
                    saving={saving}
                    onBack={handleBack}
                    onSave={handleSave}
                    onTogglePublish={handleTogglePublish}
                />

                {/* Session blocks */}
                <div className="flex flex-col gap-4">
                    {sessions.map((session, index) => (
                        <div
                            key={session._key}
                            ref={(el) => { sessionRefs.current[session._key] = el; }}
                        >
                            <SessionBlock
                                session={session}
                                sessionIndex={index}
                                allSessions={sessions}
                                allSongs={allSongs}
                                isMultiSession={isMultiSession}
                                canRemove={isMultiSession && sessions.length > 1}
                                isDirty={dirtyKeys.has(session._key)}
                                hasError={emptySessionKeys.includes(session._key)}
                                onAddSong={(key, song) => {
                                    addSong(key, song);
                                    setEmptySessionKeys((prev) => prev.filter((k) => k !== key));
                                }}
                                onRemoveSong={removeSong}
                                onReorderSongs={reorderSongs}
                                onRemoveSession={removeSession}
                                onApplySameAs={applySameAs}
                                onClearSameAs={clearSameAs}
                                isSongAdded={isSongAdded}
                            />
                        </div>
                    ))}
                </div>

                {/* Add session — multi-session only */}
                {isMultiSession && (
                    <Button
                        variant="outline"
                        onClick={addSession}
                        disabled={saving}
                        className="w-full cursor-pointer border-dashed text-muted-foreground
                                   hover:text-foreground hover:border-solid"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Session
                    </Button>
                )}
            </div>

            {/* Mobile sticky save bar — only on mobile */}
            {(hasUnsavedChanges || saving || savedRecently) && (
                <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden
                                flex items-center gap-3 px-4 py-3
                                rounded-2xl border border-border bg-background/95 backdrop-blur-md
                                shadow-xl transition-all">
                    {savedRecently ? (
                        /* Saved state — full width confirmation */
                        <p className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 w-full justify-center">
                            <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            All changes saved
                        </p>
                    ) : saving ? (
                        /* Saving state — full width spinner */
                        <Button
                            size="sm"
                            disabled
                            className="cursor-not-allowed w-full"
                        >
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Saving...
                        </Button>
                    ) : (
                        /* Dirty state — label + button */
                        <>
                            <p className="text-sm text-muted-foreground flex-1 truncate">
                                Unsaved changes
                            </p>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                className="cursor-pointer flex-shrink-0"
                            >
                                Save
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Unsaved changes dialog */}
            <AlertDialog open={unsavedDialog} onOpenChange={setUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes that will be lost if you leave this page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="cursor-pointer"
                            onClick={() => setUnsavedDialog(false)}
                        >
                            Stay
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                setUnsavedDialog(false);
                                pendingNavRef.current?.();
                                pendingNavRef.current = null;
                            }}
                        >
                            Leave anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}