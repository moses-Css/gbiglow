import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SongCard from '@/components/songs/SongCard';
import type { SessionSong } from '@/types';

// ── Sortable item wrapper ─────────────────────────────────────────────────────

function SortableSongItem({
    song,
    index,
    onRemove,
}: {
    song:     SessionSong;
    index:    number;
    onRemove: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: song.id });

    const style = {
        transform:  CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'z-50 relative' : ''}>
            <SongCard
                mode="session"
                song={song}
                index={index}
                isDragging={isDragging}
                onRemove={onRemove}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SessionSongListProps {
    songs:     SessionSong[];
    onRemove:  (songId: number) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function SessionSongList({
    songs,
    onRemove,
    onReorder,
}: SessionSongListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 8 },
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const fromIndex = songs.findIndex((s) => s.id === active.id);
        const toIndex   = songs.findIndex((s) => s.id === over.id);
        if (fromIndex !== -1 && toIndex !== -1) {
            onReorder(fromIndex, toIndex);
        }
    };

    if (songs.length === 0) {
        return (
            <p className="text-center text-sm text-muted-foreground py-6">
                Belum ada lagu. Cari lagu di bawah.
            </p>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={songs.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-2">
                    {songs.map((song, index) => (
                        <SortableSongItem
                            key={song.id}
                            song={song}
                            index={index}
                            onRemove={() => onRemove(song.id)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}