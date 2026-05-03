import { Checkbox } from '@/components/ui/checkbox';
import FolderPill from '@/components/songs/folder-pill';
import StatusBadge from '@/components/songs/status-badge';
import { GripVertical, X } from 'lucide-react';
import type { Song } from '@/types';
import { cn } from '@/lib/utils';

// ── Discriminated union props ─────────────────────────────────────────────────

interface LibraryCardProps {
    mode:             'library';
    song:             Song;
    isSelected?:      boolean;
    isAdmin?:         boolean;
    mobileSelectMode?: boolean;
    onClick?:         () => void;
    onToggleStatus?:  () => void;
    onTouchStart?:    () => void;
    onTouchEnd?:      () => void;
    onTouchMove?:     () => void;
}

interface SessionCardProps {
    mode:              'session';
    song:              Song;
    index:             number;
    dragHandleProps?:  React.HTMLAttributes<HTMLDivElement>;
    isDragging?:       boolean;
    onRemove:          () => void;
}

type SongCardProps = LibraryCardProps | SessionCardProps;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SongCard(props: SongCardProps) {
    if (props.mode === 'library') return <LibraryCard {...props} />;
    return <SessionCard {...props} />;
}

// ── Library mode ──────────────────────────────────────────────────────────────

function LibraryCard({
    song,
    isSelected       = false,
    isAdmin          = false,
    mobileSelectMode = false,
    onClick,
    onToggleStatus,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
}: LibraryCardProps) {
    return (
        <button
            type="button"
            className={cn(
                'w-full text-left rounded-xl border px-4 py-3.5',
                'transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card hover:bg-muted/30 active:bg-muted/50',
            )}
            onClick={onClick}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
        >
            <div className="flex items-start justify-between gap-3">
                {mobileSelectMode && isAdmin && (
                    <div className="flex-shrink-0 mt-0.5">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onClick}
                            className="pointer-events-none"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug truncate">
                        {song.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {song.folder && (
                            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium">
                                {song.folder.color_code && (
                                    <span
                                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: song.folder.color_code }}
                                    />
                                )}
                                {song.folder.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 text-right">
                    <p className="text-xl font-bold leading-none tabular-nums">
                        {song.page_number}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">page</p>
                </div>
            </div>
        </button>
    );
}

// ── Session mode ──────────────────────────────────────────────────────────────

function SessionCard({
    song,
    index,
    dragHandleProps,
    isDragging = false,
    onRemove,
}: SessionCardProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl border bg-card px-3 py-3',
                'transition-colors',
                isDragging
                    ? 'shadow-lg border-primary/30 bg-card'
                    : 'hover:bg-muted/30',
            )}
        >
            {/* Drag handle — min 44px touch target */}
            <div
                {...dragHandleProps}
                className="flex-shrink-0 flex items-center justify-center h-11 w-7 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Drag to reorder"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            </div>

            {/* Index */}
            <span className="flex-shrink-0 w-5 text-center text-sm font-mono text-muted-foreground">
                {index + 1}
            </span>

            {/* Song info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug truncate">
                    {song.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <FolderPill folder={song.folder} />
                </div>
            </div>

            {/* Page number */}
            <div className="flex-shrink-0 text-right mr-1">
                <p className="text-xl font-bold leading-none tabular-nums">
                    {song.page_number}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">page</p>
            </div>

            {/* Remove button — min 44px touch target */}
            <button
                type="button"
                onClick={onRemove}
                className="flex-shrink-0 flex items-center justify-center h-11 w-11
                           rounded-lg text-muted-foreground hover:text-destructive
                           hover:bg-destructive/10 transition-colors cursor-pointer"
                aria-label={`Remove ${song.title}`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}