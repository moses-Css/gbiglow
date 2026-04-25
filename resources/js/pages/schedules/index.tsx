import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Field from '@/components/ui/field';
import SectionLabel from '@/components/ui/section-label';
import SideDrawer from '@/components/side-drawer';
import { CalendarIcon, Copy, MoreVertical, Plus, Trash2 } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScheduleForm } from '@/hooks/schedule/useScheduleForm';
import { PRESET_COLORS, DEFAULT_FOLDER_COLOR } from '@/lib/colors';
import { show } from '@/routes/schedules';
import type { Schedule, Paginated, ScheduleType } from '@/types';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    schedules:  Paginated<Schedule>;
    categories: string[];
    filters:    { category?: string };
}

// ── Color picker ──────────────────────────────────────────────────────────────

function ColorPicker({ label, value, onChange }: {
    label:    string;
    value:    string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className="h-7 w-7 rounded-full ring-offset-2 transition-all cursor-pointer"
                        style={{
                            backgroundColor: color,
                            outline:         value === color ? `2px solid ${color}` : 'none',
                            outlineOffset:   '2px',
                        }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-md border flex-shrink-0"
                    style={{ backgroundColor: value }} />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#3B82F6"
                    className="font-mono uppercase w-32"
                />
            </div>
        </div>
    );
}

// ── Date picker ───────────────────────────────────────────────────────────────

function ScheduleDatePicker({ value, onChange }: {
    value:    string;
    onChange: (v: string) => void;
}) {
    const parsed  = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const display = parsed && isValid(parsed)
        ? format(parsed, 'MMMM d, yyyy')
        : 'Pick a date';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex h-9 w-full items-center justify-between rounded-md border',
                        'bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                        'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer',
                        !value && 'text-muted-foreground',
                    )}
                >
                    <span>{display}</span>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={parsed && isValid(parsed) ? parsed : undefined}
                    onSelect={(date) => {
                        if (date) onChange(format(date, 'yyyy-MM-dd'));
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// ── Combobox ───────────────────────────────────────────────────────────────
function CategoryCombobox({ value, onChange, categories }: {
    value:      string;
    onChange:   (v: string) => void;
    categories: string[];
}) {
    const [open, setOpen]       = useState(false);
    const [query, setQuery]     = useState(value);

    const filtered = query.trim()
        ? categories.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
        : categories;

    return (
        <div className="relative">
            <Input
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Sunday, Youth..."
                autoComplete="off"
            />
            {open && categories.length > 0 && (
                <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            No match — "{query}" will be created.
                        </p>
                    ) : (
                        filtered.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setQuery(cat);
                                    onChange(cat);
                                    setOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                            >
                                {cat}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── TypeSelector ───────────────────────────────────────────────────────────────

function ScheduleTypeSelector({ value, onChange }: {
    value:    ScheduleType;
    onChange: (v: ScheduleType) => void;
}) {
    const options: { value: ScheduleType; label: string; description: string }[] = [
        {
            value:       'regular',
            label:       'Regular',
            description: 'One session per schedule.',
        },
        {
            value:       'multi_session',
            label:       'Multi-Session',
            description: 'Multiple sessions, each with their own setlist.',
        },
    ];

    return (
        <RadioGroup
            value={value}
            onValueChange={(v) => onChange(v as ScheduleType)}
            className="grid grid-cols-2 gap-3"
        >
            {options.map((opt) => (
                <label
                    key={opt.value}
                    htmlFor={`type-${opt.value}`}
                    className={cn(
                        'flex flex-col gap-1 rounded-xl border p-3.5 cursor-pointer transition-colors',
                        value === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/40',
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{opt.label}</span>
                        <RadioGroupItem
                            id={`type-${opt.value}`}
                            value={opt.value}
                            className="cursor-pointer"
                        />
                    </div>
                    <span className="text-xs text-muted-foreground leading-snug">
                        {opt.description}
                    </span>
                </label>
            ))}
        </RadioGroup>
    );
}

// ── CopyCombobox───────────────────────────────────────────────────────────────

function CopyFromCombobox({ value, onChange, schedules }: {
    value:     string;
    onChange:  (v: string) => void;
    schedules: Schedule[];
}) {
    const [open, setOpen]         = useState(false);
    const isMouseDownRef          = useRef(false);

    const selected = schedules.find((s) => String(s.id) === value);

    // Group by category
    const grouped = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
        const key = s.category || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
    }, {});

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                onBlur={() => { if (!isMouseDownRef.current) setOpen(false); }}
                className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border',
                    'bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                    'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer',
                    !selected && 'text-muted-foreground',
                )}
            >
                <span className="truncate">
                    {selected ? selected.event_name : 'Start fresh'}
                </span>
                <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">▾</span>
            </button>

            {open && (
                <div
                    className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-64 overflow-y-auto"
                    onMouseDown={() => { isMouseDownRef.current = true; }}
                    onMouseUp={() => { isMouseDownRef.current = false; }}
                >
                    {/* Start fresh option */}
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onChange('');
                            setOpen(false);
                        }}
                        className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                            !value && 'bg-accent font-medium',
                        )}
                    >
                        Start fresh
                    </button>

                    {schedules.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            No existing schedules.
                        </p>
                    )}

                    {/* Grouped options */}
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category}>
                            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                                {category}
                            </p>
                            {items.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChange(String(s.id));
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'w-full text-left px-3 py-2 hover:bg-accent cursor-pointer',
                                        'flex items-center justify-between gap-3',
                                        String(s.id) === value && 'bg-accent/60',
                                    )}
                                >
                                    <span className="text-sm font-medium truncate">
                                        {s.event_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {new Date(s.event_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day:   'numeric',
                                            year:  'numeric',
                                        })}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchedulesIndex({ schedules, categories, filters }: Props) {
    const {
        data, setData, processing, errors,
        open, editSchedule, openCreate, openEdit, handleClose, handleSubmit,
        deleteTarget, setDeleteTarget, handleDelete, confirmDelete,
        handleCopy, availableSchedules,
    } = useScheduleForm(schedules.data);

    const applyCategory = (cat: string) => {
        router.get(
            '/schedules',
            { category: cat === 'all' ? '' : cat },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Schedules" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold md:text-2xl">Schedules</h1>
                        <p className="text-muted-foreground text-sm">Your weekly setlists, all in one place.</p>
                    </div>
                    <Button onClick={openCreate} size="sm" className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> New Schedule
                    </Button>
                </div>

                {/* Category filter */}
                <div className="flex gap-2 flex-wrap">
                    {['all', ...categories].map((cat) => (
                        <Button
                            key={cat}
                            size="sm"
                            variant={(filters.category ?? 'all') === cat ? 'default' : 'outline'}
                            onClick={() => applyCategory(cat)}
                            className="cursor-pointer"
                        >
                            {cat === 'all' ? 'All' : cat}
                        </Button>
                    ))}
                </div>

                {/* Cards grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {schedules.data.length === 0 && (
                        <p className="text-muted-foreground text-sm col-span-full py-16 text-center">
                            No schedules yet. Create your first one!
                        </p>
                    )}
                    {schedules.data.map((s) => (
                        <Card key={s.id} className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base leading-snug">
                                        {s.event_name}
                                    </CardTitle>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {s.color_primary && (
                                            <span
                                                className="h-3 w-3 rounded-full ring-1 ring-black/10"
                                                style={{ backgroundColor: s.color_primary }}
                                            />
                                        )}
                                        <Badge variant={s.is_published ? 'default' : 'secondary'}>
                                            {s.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </div>
                                </div>
                                <CardDescription>
                                    {new Date(s.event_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year:    'numeric',
                                        month:   'long',
                                        day:     'numeric',
                                    })}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="text-muted-foreground text-sm pb-2 flex-1">
                                <p>
                                    <span className="text-foreground font-medium">
                                        {s.sessions_count ?? 0}
                                    </span>{' '}
                                    {(s.sessions_count ?? 0) === 1 ? 'session' : 'sessions'} · {s.category}
                                    {s.type === 'multi_session' && (
                                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4">
                                            Multi-Session
                                        </Badge>
                                    )}
                                </p>
                                {s.copied_from && (
                                    <p className="text-xs mt-1">
                                        Copied from: <span className="italic">{s.copied_from.event_name}</span>
                                    </p>
                                )}
                            </CardContent>

                            <CardFooter className="flex gap-2 pt-2 mt-auto">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="cursor-pointer flex-1"
                                    onClick={() => router.get(show(s.id).url)}
                                >
                                    Manage Schedule
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => handleCopy(s)}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="cursor-pointer">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => openEdit(s)}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive cursor-pointer"
                                            onClick={() => handleDelete(s)}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* ── Create / Edit SideDrawer ── */}
            <SideDrawer
                open={open}
                onClose={handleClose}
                title={editSchedule ? 'Edit Schedule' : 'New Schedule'}
                subtitle={editSchedule
                    ? 'Update the details below.'
                    : 'Fill in the details to get started.'
                }
                footer={
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="schedule-form"
                            disabled={processing}
                            className="cursor-pointer min-w-28"
                        >
                            {processing
                                ? (editSchedule ? 'Saving...' : 'Creating...')
                                : (editSchedule ? 'Save Changes' : 'Create Schedule')
                            }
                        </Button>
                    </div>
                }
            >
                <form id="schedule-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

                    <SectionLabel>Event Details</SectionLabel>

                    <Field label="Event name" required error={errors.event_name}>
                        <Input
                            value={data.event_name}
                            onChange={(e) => setData('event_name', e.target.value)}
                            placeholder="Sunday Service — April 2026"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Date" required error={errors.event_date}>
                            <ScheduleDatePicker
                                value={data.event_date}
                                onChange={(v) => setData('event_date', v)}
                            />
                        </Field>
                        <Field label="Category" required error={errors.category}>
                            <CategoryCombobox
                                value={data.category}
                                onChange={(v) => setData('category', v)}
                                categories={categories}
                            />
                        </Field>
                    </div>

                    <Field label="Schedule type" required error={errors.type}>
                        <ScheduleTypeSelector
                            value={data.type}
                            onChange={(v) => setData('type', v)}
                        />
                    </Field>

                    <SectionLabel>Appearance</SectionLabel>

                    <ColorPicker
                        label="Primary color"
                        value={data.color_primary || DEFAULT_FOLDER_COLOR}
                        onChange={(v) => setData('color_primary', v)}
                    />
                    <ColorPicker
                        label="Secondary color"
                        value={data.color_secondary || DEFAULT_FOLDER_COLOR}
                        onChange={(v) => setData('color_secondary', v)}
                    />

                    <SectionLabel>Optional</SectionLabel>

                    {!editSchedule && (
                        <Field label="Copy from existing schedule">
                            <CopyFromCombobox
                                value={data.copied_from_id}
                                onChange={(v) => setData('copied_from_id', v)}
                                schedules={availableSchedules}
                            />
                        </Field>
                    )}

                    <Field label="Notes" hint="Optional">
                        <Textarea
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Anything the team should know..."
                        />
                    </Field>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_published"
                            checked={Boolean(data.is_published)}
                            onCheckedChange={(v) => setData('is_published', v)}
                        />
                        <Label htmlFor="is_published">Publish now</Label>
                    </div>

                </form>
            </SideDrawer>

            {/* ── Delete Dialog ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deleteTarget?.event_name}" will be permanently removed. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-destructive hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}