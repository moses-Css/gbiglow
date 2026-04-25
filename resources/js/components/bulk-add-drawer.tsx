import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, CheckCircle2, UploadCloud, Loader2, FileText, AlertTriangle } from 'lucide-react';
import type { Folder } from '@/types';
import { useFlash } from '@/components/flash-toast';
import { useBulkAddSongs } from '@/hooks/songs/useBulkAddSongs';

interface Props {
    open:      boolean;
    onClose:   () => void;
    folders:   Folder[];
    onSuccess: () => void;
}

export default function BulkAddDrawer({ open, onClose, folders, onSuccess }: Props) {
    const { flash } = useFlash();

    const {
        step, rows, dragging, setDragging,
        unresolvedDialog, setUnresolvedDialog,
        fileRef, dupRowRef,
        validCount, invalidCount, dupCount,
        unresolvedCount, pageConflictCount, readyCount,
        parseFile, updateRow, setDupAction, deleteRow,
        handleSubmit, doSubmit, handleReset, handleClose,
        scrollToDuplicate,
    } = useBulkAddSongs({ flash, onSuccess });

    return (
        <>
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right"
                className="w-full sm:max-w-2xl lg:max-w-5xl flex flex-col p-0 gap-0 overflow-hidden">

                <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Bulk Add Songs
                    </SheetTitle>
                </SheetHeader>

                {/* ── Upload ── */}
                {step === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 overflow-auto">
                        <div
                            onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) parseFile(file); }}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onClick={() => fileRef.current?.click()}
                            className={`w-full max-w-lg cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center
                                transition-all duration-200 select-none
                                ${dragging
                                    ? 'border-primary bg-primary/5 scale-[1.02]'
                                    : 'border-border hover:border-primary/40 hover:bg-muted/20'
                                }`}>
                            <div className="flex flex-col items-center gap-4">
                                <div className={`rounded-2xl p-4 transition-colors ${dragging ? 'bg-primary/10' : 'bg-muted'}`}>
                                    <UploadCloud className={`h-8 w-8 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-base">
                                        {dragging ? 'Drop it right here' : 'Upload your spreadsheet'}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Drag & drop or click to browse
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">.xlsx</span>
                                    <span className="text-xs text-muted-foreground">or</span>
                                    <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">.csv</span>
                                </div>
                            </div>
                        </div>

                        <input ref={fileRef} type="file" accept=".xlsx,.csv"
                            className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }} />

                        <div className="w-full max-w-lg rounded-xl border bg-muted/30 p-5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Expected spreadsheet columns
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                    { col: 'title',       req: true,  note: 'Song title' },
                                    { col: 'page_number', req: true,  note: 'Numeric, min 1' },
                                    { col: 'folder_id',   req: true,  note: 'Numeric folder ID' },
                                    { col: 'publisher',   req: false, note: 'Optional' },
                                    { col: 'status',      req: false, note: 'printed / not_printed' },
                                    { col: 'description', req: false, note: 'Optional notes' },
                                ].map(({ col, req, note }) => (
                                    <div key={col} className="flex items-center gap-2">
                                        <span className="font-mono bg-background border rounded px-1.5 py-0.5 whitespace-nowrap">
                                            {col}{req && ' *'}
                                        </span>
                                        <span className="text-muted-foreground truncate">{note}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Scanning ── */}
                {step === 'scanning' && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-5">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                                <FileText className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-ping opacity-30" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold">Reading your file...</p>
                            <p className="text-sm text-muted-foreground mt-1">Checking for duplicates too</p>
                        </div>
                        <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full animate-[scan_1.2s_ease-in-out_infinite]" />
                        </div>
                        <style>{`
                            @keyframes scan {
                                0%   { width: 0%;  margin-left: 0; }
                                50%  { width: 60%; margin-left: 20%; }
                                100% { width: 0%;  margin-left: 100%; }
                            }
                        `}</style>
                    </div>
                )}

                {/* ── Review ── */}
                {step === 'review' && (
                    <>
                        <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/10 flex-shrink-0 flex-wrap">
                            <span className="text-sm text-muted-foreground">{rows.length} rows</span>
                            <Badge variant="default" className="gap-1 cursor-default">
                                <CheckCircle2 className="h-3 w-3" /> {validCount} clean
                            </Badge>
                            {dupCount > 0 && (
                                <button onClick={scrollToDuplicate} className="cursor-pointer">
                                    <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 transition-colors border">
                                        <AlertCircle className="h-3 w-3" />
                                        {dupCount} already in library
                                    </Badge>
                                </button>
                            )}
                            {pageConflictCount > 0 && (
                                <Badge className="gap-1 bg-yellow-500/20 text-yellow-500 border-yellow-500/30 border cursor-default">
                                    <AlertTriangle className="h-3 w-3" />
                                    {pageConflictCount} page conflict{pageConflictCount > 1 ? 's' : ''}
                                </Badge>
                            )}
                            {invalidCount > 0 && (
                                <Badge variant="destructive" className="gap-1 cursor-default">
                                    <AlertCircle className="h-3 w-3" /> {invalidCount} invalid
                                </Badge>
                            )}
                            <Button variant="outline" size="sm" className="ml-auto cursor-pointer" onClick={handleReset}>
                                Re-upload
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="sticky top-0 z-10 bg-muted">
                                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b">
                                        <th className="px-3 py-2.5 w-8">#</th>
                                        <th className="px-3 py-2.5 min-w-40">Title *</th>
                                        <th className="px-3 py-2.5 min-w-32">Publisher</th>
                                        <th className="px-3 py-2.5 w-24">Page *</th>
                                        <th className="px-3 py-2.5 min-w-36">Folder *</th>
                                        <th className="px-3 py-2.5 w-32">Status</th>
                                        <th className="px-3 py-2.5 w-40">Action</th>
                                        <th className="px-3 py-2.5 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {rows.map((row, idx) => {
                                        const isFirstDup    = row._isDuplicate && rows.find((r) => r._isDuplicate) === row;
                                        const hasError      = row._errors.length > 0;
                                        const hasPageConflict = !!row._pageConflict;

                                        return (
                                            <tr key={row._id}
                                                ref={isFirstDup ? dupRowRef : undefined}
                                                className={`transition-colors
                                                    ${row._isDuplicate ? 'bg-red-500/8' : ''}
                                                    ${hasError ? 'bg-destructive/5' : ''}
                                                `}>
                                                <td className="px-3 py-2 align-middle">
                                                    <div className="flex items-center gap-1.5">
                                                        {row._isDuplicate && (
                                                            <div className="w-1 h-6 rounded-full bg-red-500 flex-shrink-0" />
                                                        )}
                                                        {hasError && !row._isDuplicate && (
                                                            <div className="w-1 h-6 rounded-full bg-destructive flex-shrink-0" />
                                                        )}
                                                        {!row._isDuplicate && !hasError && (
                                                            <div className="w-1 h-6 rounded-full bg-transparent flex-shrink-0" />
                                                        )}
                                                        <span className="text-muted-foreground text-xs">{idx + 1}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <Input value={row.title}
                                                        onChange={(e) => updateRow(row._id, 'title', e.target.value)}
                                                        className={`h-8 text-sm ${!row.title.trim() ? 'border-destructive' : ''}`}
                                                        placeholder="Song title" />
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <Input value={row.publisher}
                                                        onChange={(e) => updateRow(row._id, 'publisher', e.target.value)}
                                                        className="h-8 text-sm"
                                                        placeholder="—" />
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <div className="relative group/page">
                                                        <Input value={row.page_number} type="number" min={1}
                                                            onChange={(e) => updateRow(row._id, 'page_number', e.target.value)}
                                                            className={`h-8 text-sm ${
                                                                row._errors.some(e => e.includes('page') || e.includes('Page'))
                                                                    ? 'border-destructive'
                                                                    : hasPageConflict
                                                                        ? 'border-yellow-500/70 bg-yellow-500/5'
                                                                        : ''
                                                            }`}
                                                            placeholder="1" />
                                                        {hasPageConflict && (
                                                            <div className="absolute bottom-full left-0 mb-1.5 z-50">
                                                                <div className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-yellow-500 border border-yellow-500/30 px-2.5 py-1.5 text-xs text-white shadow-md">
                                                                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                                                    Page taken by "{row._pageConflict}"
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <Select value={row.folder_id}
                                                        onValueChange={(v) => updateRow(row._id, 'folder_id', v)}>
                                                        <SelectTrigger className={`h-8 text-sm ${!row.folder_id ? 'border-destructive' : ''}`}>
                                                            <SelectValue placeholder="Pick folder" />
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
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <Select value={row.status}
                                                        onValueChange={(v) => updateRow(row._id, 'status', v)}>
                                                        <SelectTrigger className="h-8 text-sm w-full cursor-pointer">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="not_printed">Not Printed</SelectItem>
                                                            <SelectItem value="printed">Printed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    {row._isDuplicate ? (
                                                        <Select value={row._dupAction ?? ''}
                                                            onValueChange={(v) => setDupAction(row._id, v as 'make_version' | 'overwrite' | 'skip')}>
                                                            <SelectTrigger className={`h-8 text-xs ${!row._dupAction ? 'border-red-500/50 text-red-500' : 'border-green-500/50'}`}>
                                                                <SelectValue placeholder="Already in library — resolve" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="make_version">
                                                                    <span className="flex flex-col">
                                                                        <span>Keep Both</span>
                                                                        <span className="text-[10px] text-muted-foreground">Save as a new version</span>
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="overwrite">
                                                                    <span className="flex flex-col">
                                                                        <span>Overwrite</span>
                                                                        <span className="text-[10px] text-muted-foreground">Replace the existing one</span>
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="skip">
                                                                    <span className="flex flex-col">
                                                                        <span>Skip</span>
                                                                        <span className="text-[10px] text-muted-foreground">Don't add this song</span>
                                                                    </span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : hasPageConflict ? (
                                                        <span className="text-xs text-yellow-500">Fix page conflict</span>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <div className="flex items-center gap-1">
                                                        {hasError && (
                                                            <div className="group/err relative">
                                                                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
                                                                <div className="absolute right-0 bottom-6 z-50 hidden group-hover/err:block
                                                                    w-52 rounded-md border bg-popover p-2.5 shadow-md text-xs">
                                                                    {row._errors.map((e, i) => (
                                                                        <p key={i} className="text-destructive flex items-start gap-1">
                                                                            <span className="mt-0.5">•</span> {e}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <button type="button"
                                                            onClick={() => deleteRow(row._id)}
                                                            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer px-1 text-xs">
                                                            ✕
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t flex-shrink-0 flex items-center gap-3">
                            <p className="text-sm text-muted-foreground flex-1">
                                {unresolvedCount > 0
                                    ? <span className="text-red-500">{unresolvedCount} duplicate{unresolvedCount > 1 ? 's' : ''} need a resolution before saving.</span>
                                    : invalidCount > 0
                                        ? `${invalidCount} row${invalidCount > 1 ? 's' : ''} need a fix before saving.`
                                        : `${readyCount} song${readyCount !== 1 ? 's' : ''} ready to save.`
                                }
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose} className="cursor-pointer">
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}
                                    disabled={readyCount === 0 && unresolvedCount === 0}
                                    className="cursor-pointer">
                                    Save {readyCount} song{readyCount !== 1 ? 's' : ''}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Submitting ── */}
                {step === 'submitting' && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="font-medium">Saving your songs...</p>
                        <p className="text-sm text-muted-foreground">
                            Adding {readyCount} songs to the library.
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>

        <AlertDialog open={unresolvedDialog} onOpenChange={setUnresolvedDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Unresolved duplicates</AlertDialogTitle>
                    <AlertDialogDescription>
                        {unresolvedCount} song{unresolvedCount > 1 ? 's are' : ' is'} already in the library.
                        Apply a bulk action below or go back and resolve them individually.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <AlertDialogAction variant="outline" className="cursor-pointer flex-1"
                            onClick={() => { setUnresolvedDialog(false); doSubmit('skip'); }}>
                            Skip all
                        </AlertDialogAction>
                        <AlertDialogAction variant="outline" className="cursor-pointer flex-1"
                            onClick={() => { setUnresolvedDialog(false); doSubmit('make_version'); }}>
                            Keep both
                        </AlertDialogAction>
                        <AlertDialogAction className="cursor-pointer flex-1"
                            onClick={() => { setUnresolvedDialog(false); doSubmit('overwrite'); }}>
                            Overwrite all
                        </AlertDialogAction>
                    </div>
                    <AlertDialogCancel className="cursor-pointer w-full">
                        Go back & resolve individually
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}