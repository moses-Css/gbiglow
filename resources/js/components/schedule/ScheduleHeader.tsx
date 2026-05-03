import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { show } from '@/routes/schedules';
import type { Schedule } from '@/types';
import { cn } from '@/lib/utils';

interface ScheduleHeaderProps {
    schedule:          Schedule;
    hasUnsavedChanges: boolean;
    saving:            boolean;
    onBack:            () => void;
    onSave:            () => void;
    onTogglePublish:   () => void;
}

function UnsavedBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
        </span>
    );
}

export default function ScheduleHeader({
    schedule,
    hasUnsavedChanges,
    saving,
    onBack,
    onSave,
    onTogglePublish,
}: ScheduleHeaderProps) {
    const formattedDate = new Date(schedule.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric',
    });

    return (
        <div className="flex flex-col gap-4">

            {/* Back */}
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={onBack}
            >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Schedules
            </Button>

            {/* Zone 1 — Schedule info */}
            <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold leading-tight">
                        {schedule.event_name}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant={schedule.is_published ? 'default' : 'secondary'}>
                            {schedule.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {schedule.type === 'multi_session' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                Multi-Session
                            </Badge>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    {formattedDate} · {schedule.category}
                </p>

                {schedule.copied_from && (
                    <button
                        type="button"
                        onClick={() => router.get(show(schedule.copied_from!.id).url)}
                        className="flex items-center gap-1.5 w-fit group"
                    >
                        <span className="text-xs text-muted-foreground">Copied from</span>
                        <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0 h-5 font-normal cursor-pointer group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                        >
                            {schedule.copied_from.event_name} ↗
                        </Badge>
                    </button>
                )}

                {hasUnsavedChanges && <UnsavedBadge />}
            </div>

            {/* Zone 2 — Action bar (desktop only — mobile uses sticky bottom bar) */}
            <div className="hidden md:flex items-center gap-2 pt-3 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onTogglePublish}
                    disabled={saving}
                    className="cursor-pointer"
                >
                    <Globe className="mr-1.5 h-3.5 w-3.5" />
                    {schedule.is_published ? 'Unpublish' : 'Publish'}
                </Button>

                <div className="flex-1" />

                <Button
                    size="sm"
                    onClick={onSave}
                    disabled={saving || !hasUnsavedChanges}
                    className="cursor-pointer min-w-28"
                >
                    {saving
                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</>
                        : 'Save Changes'
                    }
                </Button>
            </div>
        </div>
    );
}