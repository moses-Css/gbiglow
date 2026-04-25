import { useCallback, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Play, Pause, MoreVertical, RefreshCw, Music2,
    LinkIcon, Link2Off, Volume2, Search, CheckCircle2,
    Clock, HardDrive, ListMusic,
} from 'lucide-react';
import { useFlash } from '@/components/flash-toast';
import type { Folder } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AudioSong {
    id:                  number;
    drive_id:            string;
    title:               string;
    duration:            number | null;
    duration_formatted:  string;
    file_size:           number | null;
    file_size_formatted: string;
    mime_type:           string;
    drive_url:           string | null;
    sync_status:         'synced' | 'pending' | 'error';
    last_synced_at:      string | null;
    song_id:             number | null;
    song?: { id: number; title: string; folder?: Folder };
}

interface Song {
    id:        number;
    title:     string;
    publisher: string | null;
    folder_id: number | null;
    folder?:   Folder;
}

interface Paginated<T> {
    data:         T[];
    current_page: number;
    last_page:    number;
    total:        number;
    from:         number;
    to:           number;
}

interface SyncProgress {
    status:    string;
    progress:  number;
    processed: number;
    total:     number;
}

interface Props {
    audioSongs: Paginated<AudioSong>;
    songs:      Song[];
    stats:      { total: number; synced: number; pending: number; linked: number };
    filters:    { search?: string };
}

// ── CSRF helper ───────────────────────────────────────────────────────────────

function getCsrf(): string {
    return decodeURIComponent(
        document.cookie.split('; ')
            .find((c) => c.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? ''
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AudioIndex({ audioSongs, songs, stats, filters }: Props) {
    const { flash } = useFlash();

    // ── Player state
    const audioRef                      = useRef<HTMLAudioElement>(null);
    const pollIntervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);
    const [playingId, setPlayingId]     = useState<number | null>(null);
    const [loadingId, setLoadingId]     = useState<number | null>(null);
    const [progress, setProgress]       = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);

    // --Search state
    const [search, setSearch]                     = useState(filters.search ?? '');
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [searchLoading, setSearchLoading]       = useState(false);
    const [searchQueried, setSearchQueried]       = useState(false);
    const searchDebounce                          = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const suggestionsCache                        = useRef<Record<string, string[]>>({});
    const inputFocused = useRef(false);

    const applyFilters = useCallback((overrides: { search?: string }) => {
        const params = Object.fromEntries(
            Object.entries(overrides).map(([k, v]) => [k, v === '' ? undefined : v])
        );
        router.get('/audio-songs', params, {
            preserveState: true,
            replace: true,
            only: ['audioSongs'],
        });
    }, []);

    // ── Sync state
    const [syncing, setSyncing]           = useState(false);
    const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

    // ── Drawer state
    const [drawerOpen, setDrawerOpen]     = useState(false);
    const [drawerTarget, setDrawerTarget] = useState<AudioSong | null>(null);
    const [songSearch, setSongSearch]     = useState('');
    const [linkingId, setLinkingId]       = useState<number | null>(null);

    // ── Player ────────────────────────────────────────────────────────────────

    const handlePlay = useCallback(async (audio: AudioSong) => {
        if (playingId === audio.id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }
        setLoadingId(audio.id);
        try {
            const res       = await fetch(`/audio-songs/${audio.id}/stream-url`);
            const { url }   = await res.json();
            if (audioRef.current) {
                audioRef.current.src = url;
                await audioRef.current.play();
                setPlayingId(audio.id);
            }
        } catch {
            flash('Could not load audio stream.', 'error');
        } finally {
            setLoadingId(null);
        }
    }, [playingId, flash]);

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;
        const t = audioRef.current.currentTime;
        const d = audioRef.current.duration || 1;
        setCurrentTime(t);
        setAudioDuration(d);
        setProgress((t / d) * 100);
    }, []);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>, audio: AudioSong) => {
        if (playingId !== audio.id || !audioRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
    }, [playingId]);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

    // ── Sync + Polling ────────────────────────────────────────────────────────

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const pollSyncStatus = useCallback(() => {
        // Prevent duplicate intervals
        stopPolling();

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res  = await fetch('/audio-songs/sync-status');
                const json: SyncProgress = await res.json();
                setSyncProgress(json);

                if (json.status === 'completed' || json.status === 'failed') {
                    stopPolling();
                    setTimeout(() => {
                        router.reload({ only: ['audioSongs', 'stats'] });
                    }, 300);
                    
                    flash(
                        json.status === 'completed'
                            ? `Sync done! ${json.total} tracks updated.`
                            : 'Sync failed. Check logs.',
                        json.status === 'completed' ? 'success' : 'error'
                    );
                    setSyncProgress(null);
                }
            } catch {
                stopPolling();
            }
        }, 1500);
    }, [flash, stopPolling]);

    const handleSync = useCallback(async () => {
        setSyncing(true);
        // Optimistic UI — show syncing state immediately
        setSyncProgress({ status: 'processing', progress: 0, processed: 0, total: 0 });

        try {
            const res  = await fetch('/audio-songs/sync', {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': getCsrf() },
            });
            const json = await res.json();
            flash(json.message ?? 'Sync started! 🔄', 'info');
            pollSyncStatus();
        } catch {
            flash('Could not start sync.', 'error');
            setSyncProgress(null);
        } finally {
            setSyncing(false);
        }
    }, [flash, pollSyncStatus]);

    // ── Link / Unlink ─────────────────────────────────────────────────────────

    const openAddTo = useCallback((audio: AudioSong) => {
        setDrawerTarget(audio);
        setSongSearch('');
        setDrawerOpen(true);
    }, []);

    const handleLink = useCallback(async (audio: AudioSong, songId: number) => {
        setLinkingId(songId);
        try {
            await fetch(`/audio-songs/${audio.id}/link-song`, {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ song_id: songId }),
            });
            flash(`Linked "${audio.title}" to a song!`);
            router.reload({ only: ['audioSongs'] });
            setDrawerOpen(false);
        } catch {
            flash('Could not link. Please try again.', 'error');
        } finally {
            setLinkingId(null);
        }
    }, [flash]);

    const handleUnlink = useCallback(async (audio: AudioSong) => {
        try {
            await fetch(`/audio-songs/${audio.id}/unlink-song`, {
                method:  'POST',
                headers: { 'X-XSRF-TOKEN': getCsrf() },
            });
            flash('Audio unlinked.');
            router.reload({ only: ['audioSongs'] });
        } catch {
            flash('Could not unlink.', 'error');
        }
    }, [flash]);

    // ── Filtered songs ────────────────────────────────────────────────────────

    const filteredSongs = songs.filter((s) => {
        const q = songSearch.toLowerCase();
        return s.title.toLowerCase().includes(q) ||
               (s.publisher ?? '').toLowerCase().includes(q);
    });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={[{ title: 'Audio Library', href: '/audio-songs' }]}>
            <Head title="Audio Library" />
            <div className="flex flex-col gap-6 px-4 py-6 md:px-6">

                <audio ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setPlayingId(null)}
                    className="hidden" />

                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Audio Library</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Synced from Google Drive · {stats.total} tracks
                            </p>
                        </div>
                        <Button onClick={handleSync} disabled={syncing || syncProgress?.status === 'processing'}
                            className="cursor-pointer gap-2">
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Starting...' : syncProgress?.status === 'processing' ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    </div>

                    {/* Progress bar */}
                    {syncProgress?.status === 'processing' && (
                        <div className="w-full max-w-sm">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                                <span>Syncing from Drive...</span>
                                <span>{syncProgress.processed}/{syncProgress.total || '?'}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{ width: `${syncProgress.progress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setSearchSuggestions([]);
                        applyFilters({ search: search.trim() });
                    }} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                autoComplete="off"
                                placeholder="Search tracks..."
                                className="pl-8 w-64"
                                onFocus={() => { inputFocused.current = true; }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSearch(val);
                                    clearTimeout(searchDebounce.current);

                                    if (val.length === 0) {
                                        setSearchSuggestions([]);
                                        setSearchLoading(false);
                                        setSearchQueried(false);
                                        applyFilters({ search: undefined });
                                        return;
                                    }
                                    if (val.length < 2) {
                                        setSearchSuggestions([]);
                                        setSearchQueried(false);
                                        return;
                                    }

                                    const cacheKey = `title:${val.toLowerCase()}`;
                                    if (suggestionsCache.current[cacheKey]) {
                                        setSearchSuggestions(suggestionsCache.current[cacheKey]);
                                        setSearchQueried(true);
                                        return;
                                    }

                                    setSearchLoading(true);
                                    searchDebounce.current = setTimeout(async () => {
                                        try {
                                            const res    = await fetch(`/audio-songs/suggestions?q=${encodeURIComponent(val)}`);
                                            const result = await res.json();
                                            suggestionsCache.current[cacheKey] = result;
                                            setSearchSuggestions(result);
                                        } catch {
                                            setSearchSuggestions([]); // ← kalau error, set empty biar no results muncul
                                        } finally {
                                            setSearchLoading(false);
                                            setSearchQueried(true); // ← pindah ke finally, selalu ke-set apapun hasilnya
                                        }
                                    }, 150);
                                }}
                                onBlur={() => {
                                inputFocused.current = false;
                                setTimeout(() => {
                                    if (!inputFocused.current) {
                                        setSearchSuggestions([]);
                                        setSearchQueried(false);
                                        setSearchLoading(false);
                                    }
                                }, 200);
                            }}
                            />
                            {(searchLoading || searchQueried) && (
                                <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                                    {searchLoading ? (
                                        <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
                                            Finding tracks...
                                        </div>
                                    ) : searchSuggestions.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                            No results for "{search}"
                                        </div>
                                    ) : (
                                        searchSuggestions.map((s) => (
                                            <button key={s} type="button"
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setSearch(s);
                                                    setSearchSuggestions([]);
                                                    setSearchQueried(false);
                                                    applyFilters({ search: s });
                                                }}>
                                                {s}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="cursor-pointer h-full">
                            Search
                        </Button>
                    </form>

                    {/* Reset */}
                    {filters.search && (
                        <Button variant="ghost" size="sm"
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => {
                                setSearch('');
                                applyFilters({ search: undefined });
                            }}>
                            Reset
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                        { label: 'Total Tracks', value: stats.total,   icon: Music2,       color: 'text-foreground' },
                        { label: 'Synced',        value: stats.synced,  icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Pending',       value: stats.pending, icon: Clock,        color: 'text-yellow-500' },
                        { label: 'Linked',        value: stats.linked,  icon: LinkIcon,     color: 'text-blue-500' },
                    ] as const).map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className={`rounded-lg bg-muted p-2 ${color}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold leading-none">{value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Track list */}
                <div className="rounded-xl border overflow-hidden">
                    {audioSongs.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="rounded-2xl bg-muted p-5">
                                <Music2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">No tracks yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Hit "Sync Now" to pull files from Google Drive.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                    <th className="w-10 px-4 py-3" />
                                    <th className="px-4 py-3">Track</th>
                                    <th className="hidden md:table-cell px-4 py-3 text-right w-20">Size</th>
                                    <th className="hidden sm:table-cell px-4 py-3 w-24">Status</th>
                                    <th className="hidden lg:table-cell px-4 py-3">Linked To</th>
                                    <th className="w-10 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {audioSongs.data.map((audio) => {
                                    const isPlaying = playingId === audio.id;
                                    const isLoading = loadingId === audio.id;

                                    return (
                                        <tr key={audio.id}
                                            className={`group transition-colors hover:bg-muted/20 ${isPlaying ? 'bg-primary/5' : ''}`}>

                                            {/* Play */}
                                            <td className="px-4 py-3">
                                                <button onClick={() => handlePlay(audio)}
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full
                                                        border transition-all cursor-pointer
                                                        ${isPlaying
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background hover:border-primary/50'
                                                        }`}>
                                                    {isLoading
                                                        ? <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                                        : isPlaying
                                                            ? <Pause className="h-3 w-3" />
                                                            : <Play className="h-3 w-3 ml-0.5" />
                                                    }
                                                </button>
                                            </td>

                                            {/* Title */}
                                            <td className="px-4 py-3 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {isPlaying && (
                                                        <Volume2 className="h-3.5 w-3.5 text-primary flex-shrink-0 animate-pulse" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate">{audio.title}</p>
                                                        {isPlaying ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex-1 h-1 rounded-full bg-muted cursor-pointer"
                                                                    onClick={(e) => handleSeek(e, audio)}>
                                                                    <div className="h-full rounded-full bg-primary transition-all"
                                                                        style={{ width: `${progress}%` }} />
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                                                    {formatTime(currentTime)} / {formatTime(audioDuration)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            audio.duration_formatted !== '—' && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {audio.duration_formatted}
                                                                </p>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Size */}
                                            <td className="hidden md:table-cell px-4 py-3 text-right text-xs text-muted-foreground">
                                                {audio.file_size_formatted}
                                            </td>

                                            {/* Status */}
                                            <td className="hidden sm:table-cell px-4 py-3">
                                                <Badge
                                                    variant={audio.sync_status === 'synced' ? 'default' : 'secondary'}
                                                    className="text-[10px] capitalize">
                                                    {audio.sync_status}
                                                </Badge>
                                            </td>

                                            {/* Linked */}
                                            <td className="hidden lg:table-cell px-4 py-3">
                                                {audio.song ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {audio.song.folder?.color_code && (
                                                            <span className="h-2 w-2 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: audio.song.folder.color_code }} />
                                                        )}
                                                        <span className="text-sm truncate max-w-40">{audio.song.title}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Not linked</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"
                                                            className="h-8 w-8 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="cursor-pointer gap-2"
                                                            onClick={() => openAddTo(audio)}>
                                                            <ListMusic className="h-3.5 w-3.5" />
                                                            Add to song
                                                        </DropdownMenuItem>
                                                        {audio.song_id && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer gap-2 text-destructive"
                                                                    onClick={() => handleUnlink(audio)}>
                                                                    <Link2Off className="h-3.5 w-3.5" />
                                                                    Unlink
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {audio.drive_url && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                                                    <a href={audio.drive_url} target="_blank" rel="noopener noreferrer">
                                                                        <HardDrive className="h-3.5 w-3.5" />
                                                                        Open in Drive
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {audioSongs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{audioSongs.from}–{audioSongs.to} of {audioSongs.total}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="cursor-pointer"
                                disabled={audioSongs.current_page === 1}
                                onClick={() => router.get('/audio-songs',
                                    { page: audioSongs.current_page - 1 },
                                    { preserveState: true })}>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" className="cursor-pointer"
                                disabled={audioSongs.current_page === audioSongs.last_page}
                                onClick={() => router.get('/audio-songs',
                                    { page: audioSongs.current_page + 1 },
                                    { preserveState: true })}>
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add to Song Drawer ── */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                    <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
                        <SheetTitle className="text-base flex items-center gap-2">
                            <ListMusic className="h-4 w-4" />
                            Link to a song
                        </SheetTitle>
                        {drawerTarget && (
                            <p className="text-sm text-muted-foreground truncate">
                                Linking: <span className="font-medium text-foreground">{drawerTarget.title}</span>
                            </p>
                        )}
                    </SheetHeader>

                    <div className="px-6 py-3 border-b flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={songSearch}
                                onChange={(e) => setSongSearch(e.target.value)}
                                placeholder="Search songs..."
                                className="pl-9 h-9" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {filteredSongs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                                <Music2 className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {songSearch ? `No songs matching "${songSearch}"` : 'No songs available'}
                                </p>
                                <Button>
                                    Create song
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredSongs.map((song) => {
                                    const isCurrentlyLinked = drawerTarget?.song_id === song.id;
                                    const isLinking         = linkingId === song.id;

                                    return (
                                        <button key={song.id}
                                            disabled={isLinking}
                                            onClick={() => drawerTarget && handleLink(drawerTarget, song.id)}
                                            className={`w-full flex items-center gap-3 px-6 py-3 text-left
                                                transition-colors cursor-pointer hover:bg-muted/30
                                                ${isCurrentlyLinked ? 'bg-primary/5' : ''}
                                                ${isLinking ? 'opacity-50' : ''}`}>
                                            {song.folder?.color_code ? (
                                                <span className="h-2 w-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: song.folder.color_code }} />
                                            ) : (
                                                <span className="h-2 w-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{song.title}</p>
                                                {song.publisher && (
                                                    <p className="text-xs text-muted-foreground">{song.publisher}</p>
                                                )}
                                            </div>
                                            {isCurrentlyLinked && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                                            {isLinking && <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}