import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { router } from '@inertiajs/react';
import { getCsrf } from '@/lib/utils';
import { bulkStore as bulkStoreRoute, bulkCheckDuplicates as bulkCheckDuplicatesRoute, checkPageConflict as checkPageConflictRoute } from '@/routes/songs';
import type {Folder} from '@/types';
type DuplicateAction = 'make_version' | 'overwrite' | 'skip' | null;

export interface BulkRow {
    _id:           string;
    title:         string;
    publisher:     string;
    page_number:   string;
    status:        'printed' | 'not_printed';
    folder_id:     string;
    description:   string;
    _errors:       string[];
    _isDuplicate:  boolean;
    _dupAction:    DuplicateAction;
    _pageConflict: string | null;
}

interface UseBulkAddSongsOptions {
    folders:   Folder[];
    flash:     (message: string) => void;
    onSuccess: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseStatus(val: unknown): 'printed' | 'not_printed' {
    const s = String(val ?? '').toLowerCase().trim().replace(/\s+/g, '');
    if (['printed', 'yes', 'true', '1', 'y'].includes(s)) return 'printed';
    return 'not_printed';
}

function validateRow(row: BulkRow, allRows: BulkRow[] = [], folders: Folder[] = []): string[] {
    const errs: string[] = [];

    if (!row.title.trim())
        errs.push('Title is required');
    if (!row.page_number || isNaN(Number(row.page_number)) || Number(row.page_number) < 1)
        errs.push('Page number must be ≥ 1');
    if (!row.folder_id) {
        errs.push('Folder is required');
    } else if (folders.length > 0 && !folders.some((f) => String(f.id) === row.folder_id)) {
        errs.push(`Folder ID ${row.folder_id} not found`);
    }

    if (row.folder_id && row.page_number && allRows.length > 0) {
        const conflictIdx = allRows.findIndex((r) =>
            r._id !== row._id &&
            r.folder_id === row.folder_id &&
            String(r.page_number) === String(row.page_number)
        );
        if (conflictIdx !== -1) {
            errs.push(`Same page as row ${conflictIdx + 1} in this batch`);
        }
    }

    return errs;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBulkAddSongs({ folders, flash, onSuccess }: UseBulkAddSongsOptions) {
    const [step, setStep]         = useState<'upload' | 'scanning' | 'review' | 'submitting'>('upload');
    const [rows, setRows]         = useState<BulkRow[]>([]);
    const [dragging, setDragging] = useState(false);
    const [unresolvedDialog, setUnresolvedDialog] = useState(false);

    const fileRef            = useRef<HTMLInputElement>(null);
    const dupRowRef          = useRef<HTMLTableRowElement>(null);
    const pageConflictTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // ── Derived ───────────────────────────────────────────────────────────────

    const validCount        = rows.filter((r) => r._errors.length === 0 && !r._isDuplicate).length;
    const invalidCount      = rows.filter((r) => r._errors.length > 0).length;
    const dupCount          = rows.filter((r) => r._isDuplicate).length;
    const unresolvedCount   = rows.filter((r) => r._isDuplicate && r._dupAction === null).length;
    const pageConflictCount = rows.filter((r) => r._pageConflict).length;
    const readyCount        = rows.filter((r) =>
        r._errors.length === 0 && (!r._isDuplicate || r._dupAction !== null)
    ).length;

    // ── Page conflict check ───────────────────────────────────────────────────

    const checkPageConflict = useCallback((rowId: string, pageNumber: string, folderId: string) => {
        clearTimeout(pageConflictTimers.current[rowId]);
        if (!pageNumber || !folderId) {
            setRows((prev) => prev.map((r) => r._id === rowId ? { ...r, _pageConflict: null } : r));
            return;
        }
        pageConflictTimers.current[rowId] = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ page_number: pageNumber, folder_id: folderId });
                const res    = await fetch(`${checkPageConflictRoute.url()}?${params}`);
                const json   = await res.json();
                setRows((prev) => prev.map((r) =>
                    r._id === rowId ? { ...r, _pageConflict: json.conflict?.title ?? null } : r
                ));
            } catch {
                // silent fail
            }
        }, 400);
    }, []);

    // ── Parse file ────────────────────────────────────────────────────────────

    const parseFile = useCallback(async (file: File) => {
        setStep('scanning');
        await new Promise((r) => setTimeout(r, 600));

        const reader = new FileReader();
        reader.onload = async (e) => {
            const wb  = XLSX.read(e.target?.result, { type: 'binary' });
            const ws  = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

            const parsed: BulkRow[] = raw.map((r) => ({
                _id:           Math.random().toString(36).slice(2) + Date.now().toString(36),
                title:         String(r['title']       ?? r['Title']       ?? '').trim(),
                publisher:     String(r['publisher']   ?? r['Publisher']   ?? '').trim(),
                page_number:   String(r['page_number'] ?? r['Page']        ?? r['page'] ?? '').trim(),
                status:        parseStatus(r['status'] ?? r['Status']      ?? r['STATUS'] ?? ''),
                folder_id:     String(r['folder_id']   ?? '').trim(),
                description:   String(r['description'] ?? r['Description'] ?? '').trim(),
                _errors:       [],
                _isDuplicate:  false,
                _dupAction:    null,
                _pageConflict: null,
            }));

            parsed.forEach((row) => { row._errors = validateRow(row, parsed, folders); });

            try {
                const titles = parsed.map((r) => ({ title: r.title, publisher: r.publisher }));
                const res = await fetch(bulkCheckDuplicatesRoute.url(), {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                    body:    JSON.stringify({ songs: titles }),
                });
                const { duplicates }: { duplicates: string[] } = await res.json();

                const marked = parsed.map((r) => ({
                    ...r,
                    _isDuplicate: duplicates.includes(`${r.title}||${r.publisher}`),
                    _dupAction:   null as DuplicateAction,
                }));

                setRows([
                    ...marked.filter((r) => !r._isDuplicate),
                    ...marked.filter((r) => r._isDuplicate),
                ]);
            } catch {
                setRows(parsed);
            }

            setStep('review');
        };
        reader.readAsBinaryString(file);
    }, []);

    // ── Row edit ──────────────────────────────────────────────────────────────

    const updateRow = useCallback((id: string, field: keyof BulkRow, value: string) => {
        setRows((prev) => {
            const next = prev.map((r) => {
                if (r._id !== id) return r;
                const updated = { ...r, [field]: value } as BulkRow;
                if (field === 'page_number' || field === 'folder_id') {
                    const pg = field === 'page_number' ? value : r.page_number;
                    const fl = field === 'folder_id'   ? value : r.folder_id;
                    checkPageConflict(id, pg, fl);
                }
                return updated;
            });
            return next.map((r) => ({ ...r, _errors: validateRow(r, next, folders) }));
        });
    }, [checkPageConflict]);

    const setDupAction = useCallback((id: string, action: DuplicateAction) => {
        setRows((prev) => prev.map((r) => r._id === id ? { ...r, _dupAction: action } : r));
    }, []);

    const deleteRow = useCallback((id: string) => {
        setRows((prev) => {
            const next = prev.filter((r) => r._id !== id);
            return next.map((r) => ({ ...r, _errors: validateRow(r, next, folders) }));
        });
    }, []);

    // ── Reset ─────────────────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
        setStep('upload');
        setRows([]);
        if (fileRef.current) fileRef.current.value = '';
    }, []);

    const handleClose = useCallback(() => {
        handleReset();
        onSuccess();
    }, [handleReset, onSuccess]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const doSubmit = useCallback(async (bulkDupAction?: 'make_version' | 'overwrite' | 'skip') => {
        setStep('submitting');

        const toSend = rows
            .filter((r) => {
                if (r._errors.length > 0) return false;
                const action = bulkDupAction ?? r._dupAction;
                if (r._isDuplicate && action === 'skip') return false;
                return true;
            })
            .map((r) => {
                const payload: Record<string, unknown> = {
                    title:       r.title,
                    publisher:   r.publisher   || null,
                    page_number: Number(r.page_number),
                    status:      r.status,
                    folder_id:   Number(r.folder_id),
                    description: r.description || null,
                };
                const action = bulkDupAction ?? (r._isDuplicate ? r._dupAction : null);
                if (action) payload.force_action = action;
                return payload;
            });

        try {
            const res = await fetch(bulkStoreRoute.url(), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                body:    JSON.stringify({ songs: toSend }),
            });
            const json: { created: number; skipped: number } = await res.json();

            const msg = json.skipped > 0
                ? `${json.created} songs added, ${json.skipped} skipped.`
                : `${json.created} song${json.created !== 1 ? 's' : ''} added to the library.`;

            flash(msg);
            router.reload({ only: ['songs'] });
            onSuccess();
            handleReset();
        } catch {
            setStep('review');
            flash('Something went wrong. Please try again.');
        }
    }, [rows, flash, onSuccess, handleReset]);

    const handleSubmit = useCallback(() => {
        if (unresolvedCount > 0) { setUnresolvedDialog(true); return; }
        doSubmit();
    }, [unresolvedCount, doSubmit]);

    const scrollToDuplicate = useCallback(() => {
        dupRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    return {
        step, rows, dragging, setDragging,
        unresolvedDialog, setUnresolvedDialog,
        fileRef, dupRowRef,
        validCount, invalidCount, dupCount,
        unresolvedCount, pageConflictCount, readyCount,
        parseFile, updateRow, setDupAction, deleteRow,
        handleSubmit, doSubmit, handleReset, handleClose,
        scrollToDuplicate,
    };
}