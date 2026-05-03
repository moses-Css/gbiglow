import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Trash2, X } from 'lucide-react';
import SessionSongList from '@/components/schedule/SessionSongList';
import type { Song, SessionSong } from '@/types';
import type { DraftSession } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';

interface SessionBlockProps {
    session:          DraftSession;
    sessionIndex:     number;
    allSessions:      DraftSession[];
    allSongs:         Song[];
    isMultiSession:   boolean;
    canRemove:        boolean;
    isDirty:          boolean;
    hasError?:        boolean;
    onAddSong:        (sessionKey: string, song: Song) => void;
    onRemoveSong:     (sessionKey: string, songId: number) => void;
    onReorderSongs:   (sessionKey: string, from: number, to: number) => void;
    onRemoveSession:  (sessionKey: string) => void;
    onApplySameAs:    (sessionKey: string, targetKey: string) => void;
    onClearSameAs:    (sessionKey: string) => void;
    isSongAdded:      (sessionKey: string, songId: number) => boolean;
}

export default function SessionBlock({
    session,
    sessionIndex,
    allSessions,
    allSongs,
    isMultiSession,
    canRemove,
    isDirty,
    hasError = false,
    onAddSong,
    onRemoveSong,
    onReorderSongs,
    onRemoveSession,
    onApplySameAs,
    onClearSameAs,
    isSongAdded,
}: SessionBlockProps) {
    const [search, setSearch]       = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // ── Search ────────────────────────────────────────────────────────────────

    const filteredSongs = search.trim().length > 0
        ? allSongs.filter((s) =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            (s.publisher ?? '').toLowerCase().includes(search.toLowerCase())
          )
        : [];

    const handleAddSong = useCallback((song: Song) => {
        onAddSong(session._key, song);
        setSearch('');
    }, [session._key, onAddSong]);

    // ── Same-as options ───────────────────────────────────────────────────────

    const sameAsOptions = allSessions.filter((s) => s._key !== session._key);
    const sameAsTarget  = session.same_as_key
        ? allSessions.find((s) => s._key === session.same_as_key)
        : null;

    const handleSameAsToggle = (checked: boolean) => {
        if (!checked) {
            onClearSameAs(session._key);
            return;
        }
        // Default ke session pertama yang bukan ini
        const first = sameAsOptions[0];
        if (first) onApplySameAs(session._key, first._key);
    };

    const handleSameAsChange = (targetKey: string) => {
        onApplySameAs(session._key, targetKey);
    };

    const isLocked = !!session.same_as_key;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className={cn(
            'flex flex-col gap-4 rounded-xl border p-4 transition-colors',
            hasError  ? 'border-destructive/60 bg-destructive/5' :
            isDirty   ? 'border-amber-500/40 bg-amber-500/5'     : 'bg-card',
        )}>

            {/* Session header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">
                        {isMultiSession ? session.label : 'Setlist'}
                    </h3>
                    {isDirty && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {session.songs.length} song{session.songs.length === 1 ? '' : 's'}
                    </Badge>
                </div>

                {canRemove && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer flex-shrink-0"
                        onClick={() => onRemoveSession(session._key)}
                        aria-label="Hapus session"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            {/* Empty session error */}
            {hasError && (
                <p className="text-xs text-destructive flex items-center gap-1.5 -mt-1">
                    <span>⚠</span>
                    Add at least one song to this session before saving.
                </p>
            )}

            {/* Same-as toggle — hanya di session non-pertama */}
            {isMultiSession && sessionIndex > 0 && sameAsOptions.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <Switch
                            id={`same-as-${session._key}`}
                            checked={isLocked}
                            onCheckedChange={handleSameAsToggle}
                        />
                        <Label htmlFor={`same-as-${session._key}`} className="text-sm cursor-pointer">
                            Same as another session
                        </Label>
                    </div>

                    {isLocked && (
                        <div className="flex items-center gap-2">

                            <Select
                                value={session.same_as_key ?? ''}
                                onValueChange={(e) => handleSameAsChange(e.target.value)}
                            >
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder="Choose a session"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {sameAsOptions.map((s) => (
                                        <SelectItem key={s._key} value={s._key}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {sameAsTarget && (
                                <span className="text-xs text-muted-foreground text-nowrap">
                                    ({sameAsTarget.songs.length} song{sameAsTarget.songs.length === 1 ? '' : 's'})
                                </span>
                            )}
                        </div>
                    )}

                    {isLocked && (
                        <p className="text-[12px] text-muted-foreground">
                            Songs will be copied from the reference session
                        </p>
                    )}
                </div>
            )}

            {/* Song list */}
            <SessionSongList
                songs={session.songs as SessionSong[]}
                onRemove={(songId) => onRemoveSong(session._key, songId)}
                onReorder={(from, to) => onReorderSongs(session._key, from, to)}
            />

            {/* Search bar — disabled kalau locked */}
            {!isLocked && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                        placeholder="Find a song to add"
                        className="pl-9 pr-8"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {/* Search results dropdown */}
                    {searchFocused && search.trim().length > 0 && (
                        <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-60 overflow-y-auto">
                            {filteredSongs.length === 0 ? (
                                <p className="px-3 py-4 text-sm text-center text-muted-foreground">
                                    No songs found for "{search}"
                                </p>
                            ) : (
                                filteredSongs.map((song) => {
                                    const added = isSongAdded(session._key, song.id);
                                    return (
                                        <button
                                            key={song.id}
                                            type="button"
                                            disabled={added}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (!added) handleAddSong(song);
                                            }}
                                            className={cn(
                                                'w-full text-left px-3 py-2.5 text-sm transition-colors',
                                                'flex items-center justify-between gap-3',
                                                added
                                                    ? 'opacity-40 cursor-not-allowed'
                                                    : 'hover:bg-accent cursor-pointer',
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{song.title}</p>
                                                {song.publisher && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {song.publisher}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {song.folder && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                                                        {song.folder.color_code && (
                                                            <span
                                                                className="h-1.5 w-1.5 rounded-full"
                                                                style={{ backgroundColor: song.folder.color_code }}
                                                            />
                                                        )}
                                                        {song.folder.name}
                                                    </span>
                                                )}
                                                <span className="text-sm font-bold tabular-nums text-muted-foreground">
                                                    {song.page_number}
                                                </span>
                                                {added && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Added
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}