import { useCallback, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import type { Folder, FolderForm } from '@/types';
import { store, update, destroy } from '@/routes/folders';
import { DEFAULT_FOLDER_COLOR } from '@/lib/colors';

const EMPTY_FOLDER: FolderForm = {
    name:        '',
    color_code:  DEFAULT_FOLDER_COLOR,
    description: '',
    is_active:   true,
};

interface UseFolderFormOptions {
    flash: (message: string) => void;
}

export function useFolderForm({ flash }: UseFolderFormOptions) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<FolderForm>(EMPTY_FOLDER);

    const [open, setOpen]                 = useState(false);
    const [editFolder, setEditFolder]     = useState<Folder | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);

    // ── Drawer helpers ────────────────────────────────────────────────────────

    const openCreate = useCallback(() => {
        reset();
        clearErrors();
        setEditFolder(null);
        setOpen(true);
    }, [reset, clearErrors]);

    const openEdit = useCallback((folder: Folder) => {
        setData({
            name:        folder.name,
            color_code:  folder.color_code ?? DEFAULT_FOLDER_COLOR,
            description: folder.description ?? '',
            is_active:   folder.is_active,
        });
        clearErrors();
        setEditFolder(folder);
        setOpen(true);
    }, [setData, clearErrors]);

    const handleClose = useCallback(() => {
        setOpen(false);
        setEditFolder(null);
        reset();
        clearErrors();
    }, [reset, clearErrors]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (editFolder) {
            put(update(editFolder.id).url, {
                onSuccess: () => {
                    flash(`Folder "${data.name}" berhasil diupdate.`);
                    handleClose();
                },
            });
        } else {
            post(store().url, {
                onSuccess: () => {
                    flash(`Folder "${data.name}" berhasil dibuat.`);
                    handleClose();
                },
            });
        }
    }, [editFolder, data.name, post, put, handleClose, flash]);

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = useCallback((folder: Folder) => {
        setDeleteTarget(folder);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        const name = deleteTarget.name;
        router.delete(destroy(deleteTarget.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                flash(`Folder "${name}" berhasil dihapus.`);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget, flash]);

    return {
        // Form state
        data,
        setData,
        processing,
        errors,

        // Drawer state
        open,
        editFolder,

        // Delete state
        deleteTarget,
        setDeleteTarget,

        // Actions
        openCreate,
        openEdit,
        handleClose,
        handleSubmit,
        handleDelete,
        confirmDelete,
    };
}