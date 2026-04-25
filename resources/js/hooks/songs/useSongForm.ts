import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import type { Song, SongForm } from '@/types';
import { store, update, checkPageConflict as checkPageConflictRoute, checkDuplicate as checkDuplicateRoute } from '@/routes/songs';

const EMPTY_FORM: SongForm = {
    title:        '',
    description:  '',
    publisher:    '',
    page_number:  '',
    status:       'not_printed',
    folder_id:    '',
    force_action: '',
    youtube_link: '',
    sheet_file:   null,
};

interface UseSongFormOptions {
    flash:         (message: string) => void;
    onAfterClose?: () => void;
}

export function useSongForm({ flash, onAfterClose }: UseSongFormOptions) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<SongForm>(EMPTY_FORM);

    const [open, setOpen]                           = useState(false);
    const [editSong, setEditSong]                   = useState<Song | null>(null);
    const [submitted, setSubmitted]                 = useState(false);
    const [uploadProgress, setUploadProgress]       = useState(0);
    const [duplicateDialog, setDuplicateDialog]     = useState(false);
    const [pageConflictDialog, setPageConflictDialog] = useState(false);
    const [pageConflict, setPageConflict]           = useState<{ id: number; title: string } | null>(null);

    // Clear errors every time drawer opens
    useEffect(() => {
        if (open) {
            clearErrors();
            setSubmitted(false);
        }
    }, [open]);

    // ── Page conflict check ───────────────────────────────────────────────────

    const pageConflictTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const checkPageConflict = useCallback((
        pageNumber: string,
        folderId:   string,
        excludeId?: number,
    ) => {
        clearTimeout(pageConflictTimer.current);
        if (!pageNumber || !folderId) { setPageConflict(null); return; }

        pageConflictTimer.current = setTimeout(() => {
            const params = new URLSearchParams({ page_number: pageNumber, folder_id: folderId });
            if (excludeId) params.append('exclude_id', String(excludeId));

            fetch(`${checkPageConflictRoute.url()}?${params}`)
                .then((res) => res.json())
                .then((json) => setPageConflict(json.conflict ?? null))
                .catch(() => setPageConflict(null));
        }, 200);
    }, []);

    // ── Drawer helpers ────────────────────────────────────────────────────────

    const openCreate = useCallback(() => {
        reset();
        setSubmitted(false);
        setEditSong(null);
        setPageConflict(null);
        setUploadProgress(0);
        setOpen(true);
    }, [reset]);

    const openEdit = useCallback((song: Song) => {
        clearErrors();
        setSubmitted(false);
        setData({
            title:        song.title,
            description:  song.description  ?? '',
            publisher:    song.publisher    ?? '',
            page_number:  String(song.page_number),
            status:       song.status,
            folder_id:    String(song.folder_id),
            force_action: '',
            youtube_link: song.youtube_link ?? '',
            sheet_file:   null,
        });
        setEditSong(song);
        setPageConflict(null);
        setUploadProgress(0);
        setOpen(true);
    }, [setData, clearErrors]);

    const handleClose = useCallback(() => {
        setOpen(false);
        setSubmitted(false);
        setEditSong(null);
        setPageConflict(null);
        setUploadProgress(0);
        reset();
        clearErrors();
        onAfterClose?.();
    }, [reset, clearErrors, onAfterClose]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (pageConflict) { setPageConflictDialog(true); return; }

        if (!editSong) {
            const params = new URLSearchParams({
                title:     data.title,
                publisher: data.publisher,
            });
            const res  = await fetch(`${checkDuplicateRoute.url()}?${params}`);
            const json = await res.json();
            if (json.duplicate) { setDuplicateDialog(true); return; }
        }

        const isEdit  = !!editSong;
        const hasFile = data.sheet_file instanceof File;

        const onSuccess = () => {
            setUploadProgress(0);
            setSubmitted(false);
            clearErrors();
            flash(isEdit
                ? `"${data.title}" has been updated.`
                : `"${data.title}" added to the library.`
            );
            handleClose();
        };
        const onError = () => setUploadProgress(0);

        if (isEdit) {
            if (hasFile) {
                const formData = new FormData();
                formData.append('_method', 'PUT');
                formData.append('title', data.title);
                formData.append('description', data.description);
                formData.append('publisher', data.publisher);
                formData.append('page_number', data.page_number);
                formData.append('status', data.status);
                formData.append('folder_id', data.folder_id);
                formData.append('youtube_link', data.youtube_link);
                if (data.sheet_file instanceof File) {
                    formData.append('sheet_file', data.sheet_file);
                }
                router.post(update(editSong.id).url, formData, {
                    onProgress: (p) => setUploadProgress(p?.percentage ?? 0),
                    onSuccess,
                    onError,
                });
            } else {
                put(update(editSong.id).url, {
                    onSuccess,
                    onError,
                    only: ['songs'],
                });
            }
        } else {
            post(store().url, {
                forceFormData: hasFile,
                onProgress: (p) => setUploadProgress(p?.percentage ?? 0),
                onSuccess,
                onError,
                only: ['songs'],
            });
        }
    }, [data, editSong, pageConflict, post, put, clearErrors, flash, handleClose]);

    // ── Duplicate dialog actions ──────────────────────────────────────────────

    const handleDuplicateResolve = useCallback((action: 'make_version' | 'overwrite') => {
        setDuplicateDialog(false);
        router.post(store().url, { ...data, force_action: action }, {
            onSuccess: handleClose,
        });
    }, [data, handleClose]);

    const isFormReady = Boolean(data.title && data.page_number && data.folder_id);

    return {
        // Form state
        data,
        setData,
        processing,
        errors,
        submitted,
        uploadProgress,
        isFormReady,

        // Drawer state
        open,
        editSong,

        // Dialog state
        duplicateDialog,
        setDuplicateDialog,
        pageConflictDialog,
        setPageConflictDialog,
        pageConflict,

        // Actions
        openCreate,
        openEdit,
        handleClose,
        handleSubmit,
        handleDuplicateResolve,
        checkPageConflict,
    };
}