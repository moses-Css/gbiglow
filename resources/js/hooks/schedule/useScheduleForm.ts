import { useCallback, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import type { Schedule, ScheduleForm } from '@/types';
import { store, update, destroy, copy } from '@/routes/schedules';
import { DEFAULT_FOLDER_COLOR } from '@/lib/colors';
import { useFlash } from '@/components/flash-toast';

const EMPTY_FORM: ScheduleForm = {
    event_name:      '',
    event_date:      '',
    category:        '',
    type:            'regular',
    color_primary:   DEFAULT_FOLDER_COLOR,
    color_secondary: DEFAULT_FOLDER_COLOR,
    notes:           '',
    is_published:    false,
    copied_from_id:  '',
};

export function useScheduleForm(schedules: Schedule[]) {
    const { flash } = useFlash();

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<ScheduleForm>(EMPTY_FORM);

    const [open, setOpen]                   = useState(false);
    const [editSchedule, setEditSchedule]   = useState<Schedule | null>(null);
    const [deleteTarget, setDeleteTarget]   = useState<Schedule | null>(null);

    // ── Drawer ────────────────────────────────────────────────────────────────

    const openCreate = useCallback(() => {
        reset();
        clearErrors();
        setEditSchedule(null);
        setOpen(true);
    }, [reset, clearErrors]);

    const openEdit = useCallback((schedule: Schedule) => {
        setData({
            event_name:      schedule.event_name,
            event_date:      schedule.event_date,
            category:        schedule.category,
            type:            schedule.type,
            color_primary:   schedule.color_primary   ?? DEFAULT_FOLDER_COLOR,
            color_secondary: schedule.color_secondary ?? DEFAULT_FOLDER_COLOR,
            notes:           schedule.notes           ?? '',
            is_published:    schedule.is_published,
            copied_from_id:  '',
        });
        clearErrors();
        setEditSchedule(schedule);
        setOpen(true);
    }, [setData, clearErrors]);

    const handleClose = useCallback(() => {
        setOpen(false);
        setEditSchedule(null);
        reset();
        clearErrors();
    }, [reset, clearErrors]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (editSchedule) {
            put(update(editSchedule.id).url, {
                only: ['schedules'],
                onSuccess: () => {
                    flash(`"${data.event_name}" updated successfully.`);
                    handleClose();
                },
            });
        } else {
            post(store().url, {
                onSuccess: () => {
                    flash(`"${data.event_name}" created successfully.`);
                    handleClose();
                },
            });
        }
    }, [editSchedule, data.event_name, post, put, flash, handleClose]);

    // ── Copy ──────────────────────────────────────────────────────────────────

    const handleCopy = useCallback((schedule: Schedule) => {
        router.post(copy(schedule.id).url, {}, {
            onSuccess: () => flash(`"${schedule.event_name}" copied successfully.`),
        });
    }, [flash]);

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = useCallback((schedule: Schedule) => {
        setDeleteTarget(schedule);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        const name = deleteTarget.event_name;
        router.delete(destroy(deleteTarget.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                flash(`"${name}" deleted.`);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget, flash]);

    const availableSchedules = editSchedule
    ? schedules.filter((s) => s.id !== editSchedule.id)
    : schedules;

    return {
        data,
        setData,
        processing,
        errors,
        open,
        editSchedule,
        openCreate,
        openEdit,
        handleClose,
        handleSubmit,
        deleteTarget,
        setDeleteTarget,
        handleDelete,
        confirmDelete,
        handleCopy,
        availableSchedules,
    };
}