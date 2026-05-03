import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SongCard from '@/components/songs/SongCard';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    ChevronLeft, ChevronRight,
    ExternalLink, FileSpreadsheet, FileText,
    MoreVertical, Plus, Search, SlidersHorizontal, X,
} from 'lucide-react';
import SideDrawer from '@/components/side-drawer';
import FileUpload from '@/components/file-upload';
import YouTubePreview from '@/components/youtube-preview';
import BottomSheet from '@/components/bottom-sheet';
import BulkAddDrawer from '@/components/bulk-add-drawer';
import { useFlash } from '@/components/flash-toast';
import type { Folder, Paginated, Song, SongForm } from '@/types';
import { store, update, destroy, toggleStatus } from '@/routes/songs';
import Field       from '@/components/ui/field';
import SectionLabel from '@/components/ui/section-label';
import StatusBadge  from '@/components/songs/status-badge';
import FolderPill   from '@/components/songs/folder-pill';
import { useSongForm } from '@/hooks/songs/useSongForm';
import { useSongFilter } from '@/hooks/songs/useSongFilter';
import { useSongSelection } from '@/hooks/songs/useSongSelection';
import { useSongSuggestions } from '@/hooks/songs/useSongSuggestions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    songs:   Paginated<Song>;
    folders: Folder[];
    filters: { search?: string; folder?: string; status?: string };
}
// ── Main component ────────────────────────────────────────────────────────────

export default function SongsIndex({ songs, folders, filters }: Props) {
    const { auth } = usePage<{ auth: { user: { main_role: string } } }>().props;
    const isAdmin  = auth.user.main_role === 'admin';
    const { flash } = useFlash();

    const {
        titleSuggestions, setTitleSuggestions,
        publisherSuggestions, setPublisherSuggestions,
        loadingField, fetchSuggestions, resetSuggestions,
    } = useSongSuggestions();

    const {
        data, setData, processing, errors, submitted, uploadProgress, isFormReady,
        open, editSong,
        duplicateDialog, setDuplicateDialog,
        pageConflictDialog, setPageConflictDialog, pageConflict,
        openCreate, openEdit, handleClose, handleSubmit,
        handleDuplicateResolve, checkPageConflict,
    } = useSongForm({ flash, onAfterClose: resetSuggestions });

    const {
        search, localSearch, localFolder, localStatus, activeFilterCount,
        handleSearchChange, handleSearchClear,
        handleFolderChange, handleStatusChange, handleReset,
    } = useSongFilter(filters);

    const {
        selectedIds, bulkDeleteDialog, setBulkDeleteDialog, mobileSelectMode,
        toggleSelect, toggleSelectAll, clearSelection,
        confirmBulkDelete, handleLongPress, cancelLongPress, handleMobileCardTap,
    } = useSongSelection({ songs: songs.data, flash, isAdmin });


    // ── UI state ──────────────────────────────────────────────────────────────
    const [detailSong, setDetailSong]         = useState<Song | null>(null);
    const [deleteTarget, setDeleteTarget]     = useState<Song | null>(null);
    const [bulkOpen, setBulkOpen]             = useState(false);
    const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleToggleStatus = useCallback((song: Song) => {
        router.patch(toggleStatus(song.id).url, {}, {
            preserveScroll: true,
            only: ['songs'],
            onSuccess: () => {
            const next = song.status === 'printed' ? 'Not Printed' : 'Printed';
                flash(`"${song.title}" marked as ${next}.`);
            },
        });
    }, [flash]);

    const handleDelete = useCallback((song: Song) => setDeleteTarget(song), []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        const title = deleteTarget.title;
        router.delete(destroy(deleteTarget.id).url, {
            preserveScroll: true,
            only: ['songs'],
            onSuccess: () => flash(`"${title}" has been deleted.`),
        });
        setDeleteTarget(null);
    }, [deleteTarget, flash]);

    const displayedSongs = useMemo(() => {
        if (!localSearch.trim()) return songs.data;
        const q = localSearch.toLowerCase();
        return songs.data.filter((s) =>
            s.title.toLowerCase().includes(q) ||
            (s.publisher ?? '').toLowerCase().includes(q)
        );
    }, [songs.data, localSearch]);

    // ── Render ────────────────────────────────────────────────────────────────

    const folderMap = useMemo(() =>
        Object.fromEntries(folders.map((f) => [String(f.id), f])),
    [folders]);

    return (
        <AppLayout>
            <Head title="Songs" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Songs</h1>
                        <p className="text-muted-foreground text-sm">{songs.total} saved songs</p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setBulkOpen(true)} className="cursor-pointer">
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Bulk Add
                            </Button>
                            <Button onClick={openCreate} className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Add song
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Filters ── */}
                <div className="flex items-center gap-2">
                    {/* Search — live update on type */}
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            value={search}
                            autoComplete="off"
                            placeholder="Search songs..."
                            className={`pl-9 ${search ? 'pr-8' : 'pr-3'}`}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleSearchClear}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2
                                           h-5 w-5 rounded-full flex items-center justify-center
                                           bg-muted text-muted-foreground
                                           hover:bg-muted-foreground/20 hover:text-foreground
                                           transition-colors cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* Desktop filters (inline) */}
                    <div className="hidden md:flex items-center gap-2">
                        <Select value={localFolder}
                            onValueChange={handleFolderChange}>
                            <SelectTrigger className="w-40 cursor-pointer">
                                <SelectValue placeholder="All Folders" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Folders</SelectItem>
                                {folders.map((f) => (
                                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={localStatus}
                            onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-36 cursor-pointer">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="printed">Printed</SelectItem>
                                <SelectItem value="not_printed">Not Printed</SelectItem>
                            </SelectContent>
                        </Select>

                        {(filters.folder || filters.status || filters.search) && (
                            <Button variant="ghost" size="sm"
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={handleReset}>
                                Reset
                            </Button>
                        )}
                    </div>

                    {/* Mobile: Filter button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="md:hidden cursor-pointer relative"
                        onClick={() => setBottomSheetOpen(true)}
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* ── Bulk action toolbar — floating ── */}
                {isAdmin && selectedIds.size > 0 && (
                    <div className="fixed bottom-5 left-0 right-0 mx-auto z-50
                                    flex items-center gap-2 px-4 py-2.5
                                    rounded-2xl border border-border bg-background/90 backdrop-blur-md
                                    shadow-xl shadow-black/20 w-max max-w-[calc(100vw-2rem)]
                                    animate-[bulkToolbar_0.25s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                        <span className="text-sm font-semibold tabular-nums">
                            {selectedIds.size} selected
                        </span>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer text-muted-foreground h-8"
                            onClick={clearSelection}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer h-8"
                            onClick={() => setBulkDeleteDialog(true)}
                        >
                            Delete {selectedIds.size} song{selectedIds.size > 1 ? 's' : ''}
                        </Button>
                    </div>
                )}

                {/* ── Desktop table ── */}
                <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 text-xs uppercase tracking-wider">
                                {isAdmin && (
                                    <TableHead className="w-10 pl-4">
                                        <Checkbox
                                            checked={selectedIds.size === songs.data.length && songs.data.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="cursor-pointer"
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="w-8 text-center">#</TableHead>
                                <TableHead>Song</TableHead>
                                <TableHead className="hidden lg:table-cell">Publisher</TableHead>
                                <TableHead>Folder</TableHead>
                                <TableHead className="text-center w-24">Page</TableHead>
                                <TableHead className="text-center w-32">Status</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedSongs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                                            <Search className="h-8 w-8 text-muted-foreground/40" />
                                            <p className="text-sm text-muted-foreground">
                                                {localSearch ? `No songs matching "${localSearch}"` : 'No songs found.'}
                                            </p>
                                            {localSearch && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={handleSearchClear}
                                                >
                                                    Clear search
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {displayedSongs.map((song, idx) => (
                                <TableRow
                                    key={song.id}
                                    className={`group cursor-pointer hover:bg-muted/30 transition-colors
                                        ${selectedIds.has(song.id) ? 'bg-primary/5' : ''}`}
                                    onClick={() => setDetailSong(song)}
                                >
                                    {isAdmin && (
                                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.has(song.id)}
                                                onCheckedChange={() => toggleSelect(song.id)}
                                                className="cursor-pointer"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        {(songs.from ?? 0) + idx}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{song.title}</p>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                        {song.publisher ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <FolderPill folder={song.folder} />
                                    </TableCell>
                                    <TableCell className="text-center text-sm font-medium">
                                        {song.page_number}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StatusBadge
                                            status={song.status as 'printed' | 'not_printed'}
                                            interactive={isAdmin}
                                            onClick={() => {
                                                if (isAdmin) {
                                                    event?.stopPropagation();
                                                    handleToggleStatus(song);
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        {isAdmin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"
                                                        className="h-8 w-8 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(song)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive cursor-pointer"
                                                        onClick={() => handleDelete(song)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="md:hidden flex flex-col gap-2">
                    {displayedSongs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Search className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                {localSearch ? `No songs matching "${localSearch}"` : 'No songs found.'}
                            </p>
                            {localSearch && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={handleSearchClear}
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    )}
                    {mobileSelectMode && isAdmin && (
                        <p className="text-xs text-muted-foreground text-center pb-1">
                            Tap to select · Long-press to start over
                        </p>
                    )}
                    {displayedSongs.map((song) => {
                        const isSelected = selectedIds.has(song.id);
                        return (
                            <SongCard
                                key={song.id}
                                mode="library"
                                song={song}
                                isSelected={isSelected}
                                isAdmin={isAdmin}
                                mobileSelectMode={mobileSelectMode}
                                onClick={() => handleMobileCardTap(song, setDetailSong)}
                                onToggleStatus={() => handleToggleStatus(song)}
                                onTouchStart={() => handleLongPress(song)}
                                onTouchEnd={cancelLongPress}
                                onTouchMove={cancelLongPress}
                            />
                        );
                    })}
                </div>

                {/* ── Pagination ── */}
                {songs.last_page > 1 && !localSearch && (
                    <div className="flex items-center justify-center gap-1">
                        {songs.links.map((link, i) => {
                            const isFirst = i === 0;
                            const isLast  = i === songs.links.length - 1;

                            if (isFirst || isLast) {
                                return (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 cursor-pointer"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        aria-label={isFirst ? 'Previous page' : 'Next page'}
                                    >
                                        {isFirst
                                            ? <ChevronLeft className="h-4 w-4" />
                                            : <ChevronRight className="h-4 w-4" />
                                        }
                                    </Button>
                                );
                            }

                            return (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-8 min-w-[32px] cursor-pointer tabular-nums"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    aria-label={`Page ${link.label}`}
                                    aria-current={link.active ? 'page' : undefined}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Create / Edit SideDrawer ── */}
            <SideDrawer
                open={open}
                onClose={handleClose}
                title={editSong ? 'Edit Song' : 'Add New Song'}
                subtitle={editSong ? editSong.title : 'Fill in the details below'}
                footer={
                    <div className="flex items-center justify-between gap-3">
                        <Button type="button" variant="outline" onClick={handleClose} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="song-form"
                            disabled={processing || !isFormReady}
                            className="cursor-pointer min-w-24"
                        >
                            {processing ? 'Saving...' : editSong ? 'Save Changes' : 'Add Song'}
                        </Button>
                    </div>
                }
            >
                <form id="song-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Basic info */}
                    <div className="flex flex-col gap-4">
                        <SectionLabel>Basic Information</SectionLabel>

                        <Field label="Title" required error={errors.title} showError={submitted}>
                            <div className="relative">
                                <Input
                                    value={data.title}
                                    autoComplete="off"
                                    placeholder="How Great Is Our God"
                                    className={submitted && errors.title ? 'border-destructive' : ''}
                                    onChange={(e) => {
                                        setData('title', e.target.value);
                                        fetchSuggestions('title', e.target.value, setTitleSuggestions);
                                    }}
                                />
                                {(titleSuggestions.length > 0 || loadingField === 'title') && (
                                    <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                                        {loadingField === 'title' ? (
                                            <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
                                                Finding songs...
                                            </div>
                                        ) : titleSuggestions.map((s) => (
                                            <button key={s} type="button"
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setData('title', s);
                                                    setTitleSuggestions([]);
                                                }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Field>

                        <Field label="Publisher / Label">
                            <div className="relative">
                                <Input
                                    value={data.publisher}
                                    autoComplete="off"
                                    placeholder="Hillsong, GMS, Bethel..."
                                    onChange={(e) => {
                                        setData('publisher', e.target.value);
                                        fetchSuggestions('publisher', e.target.value, setPublisherSuggestions);
                                    }}
                                />
                                {(publisherSuggestions.length > 0 || loadingField === 'publisher') && (
                                    <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                                        {loadingField === 'publisher' ? (
                                            <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
                                                Finding publishers...
                                            </div>
                                        ) : publisherSuggestions.map((s) => (
                                            <button key={s} type="button"
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setData('publisher', s);
                                                    setPublisherSuggestions([]);
                                                }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Field>
                    </div>

                    {/* Location */}
                    <div className="flex flex-col gap-4">
                        <SectionLabel>Location</SectionLabel>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Folder" required error={errors.folder_id} showError={submitted}>
                                {folders.length === 0 ? (
                                    <div className="rounded-lg border border-dashed px-3 py-2.5 flex flex-col gap-1">
                                        <p className="text-xs text-muted-foreground leading-snug">
                                            No folders yet
                                        </p>
                                        <a
                                            href="/folders"
                                            className="text-xs font-medium text-primary hover:underline w-fit"
                                        >
                                            Create a folder
                                        </a>
                                    </div>
                                ) : (
                                    <Select
                                        value={data.folder_id}
                                        onValueChange={(v) => {
                                            setData('folder_id', v);
                                            checkPageConflict(data.page_number, v, editSong?.id);
                                        }}
                                    >
                                        <SelectTrigger className={`cursor-pointer w-full ${submitted && errors.folder_id ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="Pick a folder" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {folders.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    <span className="flex items-center gap-1.5">
                                                        {f.color_code && (
                                                            <span className="h-2 w-2 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: f.color_code }} />
                                                        )}
                                                        {f.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </Field>

                            <Field
                                label="Page Number"
                                required
                                error={errors.page_number}
                                showError={submitted}
                                warn={!errors.page_number && pageConflict
                                    ? `Page ${data.page_number} is taken by "${pageConflict.title}"`
                                    : undefined
                                }
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    value={data.page_number}
                                    placeholder="42"
                                    className={`${submitted && errors.page_number ? 'border-destructive focus-visible:ring-destructive/20' : ''} ${pageConflict && !errors.page_number ? 'border-yellow-500/70 focus-visible:ring-yellow-500/20' : ''}`}
                                    onChange={(e) => {
                                        setData('page_number', e.target.value);
                                        checkPageConflict(e.target.value, data.folder_id, editSong?.id);
                                    }}
                                />
                            </Field>
                        </div>

                        <Field label="Print Status">
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData('status', v as SongForm['status'])}
                            >
                                <SelectTrigger className="cursor-pointer w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_printed">Not Printed</SelectItem>
                                    <SelectItem value="printed">Printed</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    {/* Media */}
                    <div className="flex flex-col gap-4">
                        <SectionLabel>Media</SectionLabel>

                        <Field
                            label="YouTube Link"
                            hint="Optional"
                            error={errors.youtube_link}
                            showError={submitted}
                        >
                            <YouTubePreview
                                value={data.youtube_link}
                                onChange={(v) => setData('youtube_link', v)}
                                error={errors.youtube_link}
                            />
                        </Field>

                        <Field
                            label="Sheet Music File"
                            hint="PDF or PNG"
                            error={errors.sheet_file as string | undefined}
                            showError={submitted}
                        >
                            <FileUpload
                                value={data.sheet_file as File | null}
                                onChange={(f) => setData('sheet_file', f)}
                                error={errors.sheet_file as string | undefined}
                                uploadProgress={uploadProgress}
                                existingFileUrl={(editSong as Song & { sheet_file_url?: string })?.sheet_file_url}
                                existingFileName={(editSong as Song & { sheet_file_name?: string })?.sheet_file_name ?? undefined}
                                onRemoveExisting={() => setData('sheet_file', null)}
                            />

                        </Field>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-4">
                        <SectionLabel>Notes</SectionLabel>

                        <Field label="Description" hint="Optional">
                            <Textarea
                                rows={3}
                                value={data.description}
                                placeholder="Additional notes about this song..."
                                className="resize-none"
                                onChange={(e) => setData('description', e.target.value)}
                            />
                        </Field>
                    </div>
                </form>
            </SideDrawer>

            {/* ── Song Detail SideDrawer ── */}
            {detailSong && (() => {
                return (
                    <SideDrawer
                        open={!!detailSong}
                        onClose={() => setDetailSong(null)}
                        title={detailSong.title}
                        subtitle={detailSong.publisher ?? undefined}
                        headerExtra={
                            <StatusBadge
                                status={detailSong.status as 'printed' | 'not_printed'}
                                interactive={isAdmin}
                                onClick={() => {
                                    if (isAdmin) handleToggleStatus(detailSong);
                                }}
                            />
                        }
                        footer={isAdmin ? (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="cursor-pointer flex-1"
                                    onClick={() => { setDetailSong(null); openEdit(detailSong); }}
                                >
                                    Edit Song
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="cursor-pointer"
                                    onClick={() => { setDetailSong(null); handleDelete(detailSong); }}
                                >
                                    Delete
                                </Button>
                            </div>
                        ) : undefined}
                    >
                        <div className="flex flex-col divide-y divide-border">

                            {/* ── Core stats strip ── */}
                            <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden mb-6 border">
                                <div className="bg-background px-4 py-3.5">
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                        Folder
                                    </p>
                                    <FolderPill folder={detailSong.folder} />
                                </div>
                                <div className="bg-background px-4 py-3.5">
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                        Page
                                    </p>
                                    <p className="text-2xl font-bold tabular-nums leading-none">
                                        {detailSong.page_number}
                                    </p>
                                </div>
                            </div>

                            {/* ── Notes ── */}
                            {detailSong.description && (
                                <div className="p-5 border rounded-xl">
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                                        Notes
                                    </p>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {detailSong.description}
                                    </p>
                                </div>
                            )}

                            {/* ── Sheet file ── */}
                            {detailSong.sheet_file_url && (
                                <div className="py-5">
                                    <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
                                        Sheet File
                                    </p>
                                    <a
                                        href={detailSong.sheet_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3
                                                   hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer group"
                                    >
                                        <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-4 w-4 text-red-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {detailSong.sheet_file_name ?? 'Sheet file'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Open file
                                            </p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                    </a>
                                </div>
                            )}

                            {/* ── YouTube ── */}
                            {detailSong.youtube_link && (
                                <div className="py-5">
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
                                        YouTube
                                    </p>
                                    <YouTubePreview
                                        value={detailSong.youtube_link}
                                        onChange={() => {}}
                                        readOnly
                                    />
                                </div>
                            )}

                        </div>
                    </SideDrawer>
                );
            })()}

            {/* ── Mobile Bottom Sheet Filters ── */}
            <BottomSheet
                open={bottomSheetOpen}
                onClose={() => setBottomSheetOpen(false)}
                title="Filters"
                footer={
                    <div className="flex gap-2">
                        {(localFolder !== 'all' || localStatus !== 'all') && (
                            <Button
                                variant="outline"
                                className="cursor-pointer flex-1"
                                onClick={() => {
                                    handleReset();
                                    setBottomSheetOpen(false);
                                }}
                            >
                                Reset
                            </Button>
                        )}
                        <Button className="cursor-pointer flex-1" onClick={() => setBottomSheetOpen(false)}>
                            Apply
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Folder</Label>
                        <Select value={localFolder} onValueChange={handleFolderChange}>
                            <SelectTrigger className="cursor-pointer w-full">
                                <SelectValue placeholder="All Folders" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Folders</SelectItem>
                                {folders.map((f) => (
                                    <SelectItem key={f.id} value={String(f.id)}>
                                        <span className="flex items-center gap-1.5">
                                            {f.color_code && (
                                                <span className="h-2 w-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: f.color_code }} />
                                            )}
                                            {f.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Print Status</Label>
                        <Select value={localStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger className="cursor-pointer w-full">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="printed">Printed</SelectItem>
                                <SelectItem value="not_printed">Not Printed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </BottomSheet>

            {/* ── Duplicate dialog ── */}
            <AlertDialog open={duplicateDialog} onOpenChange={setDuplicateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Song Already Exists</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{data.title}" by "{data.publisher || 'unknown publisher'}" has already been added.
                            What would you like to do?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setDuplicateDialog(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="outline"
                            onClick={() => handleDuplicateResolve('make_version')}>
                            Create Another Version
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={() => handleDuplicateResolve('overwrite')}>
                            Replace Existing
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Delete dialog ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this song?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deleteTarget?.title}" will be permanently removed. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-destructive hover:bg-destructive/90"
                            onClick={confirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Page conflict dialog ── */}
            <AlertDialog open={pageConflictDialog} onOpenChange={setPageConflictDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Page Already Taken</AlertDialogTitle>
                        <AlertDialogDescription>
                            Page {data.page_number} is already used by{' '}
                            <span className="font-semibold">"{pageConflict?.title}"</span>.
                            You can't save two songs on the same page in the same folder.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setPageConflictDialog(false)} className="cursor-pointer">
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.size} songs?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {selectedIds.size} song{selectedIds.size > 1 ? 's' : ''} and their files. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-destructive hover:bg-destructive/90"
                            onClick={confirmBulkDelete}
                        >
                            Delete all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Bulk Add ── */}
            <BulkAddDrawer
                open={bulkOpen}
                onClose={() => setBulkOpen(false)}
                folders={folders}
                onSuccess={() => setBulkOpen(false)}
            />
        <style>{`
            @keyframes bulkToolbar {
                from { opacity: 0; transform: translateY(16px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `}</style>
        </AppLayout>
    );
}