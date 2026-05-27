import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Music,
    Folder,
    Plus,
    Calendar,
    Clock,
    ArrowRight,
    ListMusic,
} from 'lucide-react';
import { show as scheduleShow } from '@/routes/schedules';
import { index as songsIndex } from '@/routes/songs';
import { index as foldersIndex } from '@/routes/folders';
import { index as schedulesIndex } from '@/routes/schedules';
import type { Schedule, Song, Folder as FolderType } from '@/types';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import SideDrawer from '@/components/side-drawer';
import StatusBadge from '@/components/songs/status-badge';
import FolderPill from '@/components/songs/folder-pill';
import YouTubePreview from '@/components/youtube-preview';
import { FileText, ExternalLink } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
    total_songs:   number;
    total_folders: number;
    printed:       number;
    not_printed:   number;
}

interface Props {
    stats:             DashboardStats;
    thisWeekSchedules: Schedule[];
    recentSongs:       Song[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEventDateLabel(dateStr: string): string {
    const date = parseISO(dateStr);
    if (isToday(date))    return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
}

function getTotalSongs(schedule: Schedule): number {
    return (schedule.sessions ?? []).reduce(
        (acc, session) => acc + (session.songs?.length ?? 0),
        0,
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GreetingHeader({ name }: { name: string }) {
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Good morning' :
        hour < 17 ? 'Good afternoon' :
                    'Good evening';

    return (
        <div className="px-4 pt-2 pb-1">
            <p className="text-muted-foreground text-sm">{greeting}</p>
            <h1 className="text-3xl font-thin tracking-tight">{name} 👋</h1>
        </div>
    );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={`text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 ${className ?? ''}`}>
            {children}
        </p>
    );
}

// ── Schedule Card (horizontal scroll item) ────────────────────────────────────

function ScheduleCard({ schedule }: { schedule: Schedule }) {
    const totalSongs   = getTotalSongs(schedule);
    const sessionCount = schedule.sessions?.length ?? 0;
    const accentColor  = schedule.color_primary ?? '#6366f1';
    const dateLabel    = getEventDateLabel(schedule.event_date);

    return (
        <button
            type="button"
            onClick={() => router.visit(scheduleShow(schedule.id).url)}
            className="
                group relative flex-shrink-0 w-[72vw] max-w-[260px]
                rounded-xl border bg-card text-left
                transition-all duration-200
                active:scale-[0.97] hover:border-foreground/20
                cursor-pointer overflow-hidden
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            "
        >
            {/* Left accent bar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-16 rounded-l-xl"
                style={{
                    background: `linear-gradient(to right, ${accentColor}30, transparent)`,
                }}
            />

            <div className="pl-4 pr-3 py-3.5">
                {/* Date chip */}
                <div className="flex items-center gap-1.5 mb-2.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                        {dateLabel}
                    </span>
                </div>

                {/* Event name */}
                <p className="font-medium text-base leading-snug line-clamp-2">
                    {schedule.event_name}
                </p>

            </div>

            {/* Hover cue */}
            <div className="absolute right-3 bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
        </button>
    );
}

function EmptySchedule() {
    return (
        <div className="mx-4 rounded-xl border border-dashed bg-muted/30 px-5 py-6 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">Nothing this week</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
                No published schedules yet.
            </p>
            <Button
                size="sm"
                variant="outline"
                className="mt-3 cursor-pointer"
                onClick={() => router.visit(schedulesIndex())}
            >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create a schedule
            </Button>
        </div>
    );
}

// ── Stats Row ──────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    onClick,
}: {
    icon:     React.ElementType;
    label:    string;
    value:    number;
    sub?:     string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                flex-1 flex flex-col justify-between rounded-xl border bg-card px-4 py-4
                text-left transition-all duration-150 min-h-[110px]
                active:scale-[0.97] hover:border-foreground/20
                cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            "
        >
            <div className="flex items-center justify-between w-full">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className="rounded-md bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">{value.toLocaleString()}</p>
                {sub && (
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">{sub}</p>
                )}
            </div>
        </button>
    );
}

// ── Recent Songs ───────────────────────────────────────────────────────────────

function RecentSongItem({ song, onClick }: { song: Song; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-3 py-4 border-b border-border/50 last:border-0 w-full text-left hover:bg-muted/30 -mx-4 px-4 transition-colors cursor-pointer"
        >
            <div
                className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: song.folder?.color_code ?? '#94a3b8' }}
            >
                <span className="text-sm font-bold text-white/80 tabular-nums leading-none">
                    {song.page_number}
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {song.publisher
                        ? `${song.publisher} · ${song.folder?.name ?? '—'}`
                        : (song.folder?.name ?? '—')
                    }
                </p>
            </div>
            {song.status === 'not_printed' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0 text-muted-foreground">
                    Unprinted
                </Badge>
            )}
        </button>
    );
}

// ── Quick Actions ──────────────────────────────────────────────────────────────

function QuickActions() {
    const actions = [
        {
            label:   'Add Song',
            desc:    'Upload a new song',
            icon:    Music,
            color:   'bg-muted',
            onClick: () => router.visit(songsIndex()),
        },
        {
            label:   'New Schedule',
            desc:    'Plan a service',
            icon:    Calendar,
            color:   'bg-muted',
            onClick: () => router.visit(schedulesIndex()),
        },
        {
            label:   'Browse Songs',
            desc:    'Search the library',
            icon:    ListMusic,
            color:   'bg-muted',
            onClick: () => router.visit(songsIndex()),
        },
        {
            label:   'Folders',
            desc:    'Manage folders',
            icon:    Folder,
            color:   'bg-muted',
            onClick: () => router.visit(foldersIndex()),
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 px-4">
            {actions.map((action) => (
                <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="
                        flex flex-col gap-3 rounded-xl border bg-card px-4 py-4
                        text-left transition-all duration-150
                        active:scale-[0.97] hover:border-foreground/20 hover:bg-muted/30
                        cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    "
                >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">{action.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Dashboard({ stats, thisWeekSchedules = [], recentSongs = [] }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } } }>().props;
    const firstName = auth.user.name.split(' ')[0];
    const [detailSong, setDetailSong] = useState<Song | null>(null);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 py-4 pb-10">

                {/* Greeting */}
                <GreetingHeader name={firstName} />

                {/* This week's schedules */}
                <section>
                    <div className="px-4 mb-2">
                        <SectionTitle>This week</SectionTitle>
                    </div>

                    {thisWeekSchedules.length === 0 ? (
                        <EmptySchedule />
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory pl-4 scroll-pl-4">
                            {thisWeekSchedules.map((schedule) => (
                                <div key={schedule.id} className="snap-start">
                                    <ScheduleCard schedule={schedule} />
                                </div>
                            ))}

                            <div className="snap-start flex-shrink-0 flex items-center">
                                <button
                                    type="button"
                                    onClick={() => router.visit(schedulesIndex())}
                                    className="
                                        h-full px-5
                                        flex flex-col items-center justify-center gap-2
                                        rounded-xl border bg-card
                                        text-muted-foreground hover:text-foreground
                                        hover:border-foreground/20
                                        transition-all duration-150
                                        active:scale-[0.97] cursor-pointer
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                                    "
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    <span className="text-sm font-medium">See all</span>
                                </button>
                            </div>
                            <div className="w-4 flex-shrink-0" />
                        </div>
                    )}
                </section>

                {/* Stats */}
                <section>
                    <SectionTitle className="px-4">Library</SectionTitle>
                    <div className="flex gap-3 px-4">
                        <StatCard
                            icon={Music}
                            label="Total songs"
                            value={stats.total_songs}
                            sub={stats.not_printed > 0
                                ? `${stats.not_printed} not yet printed`
                                : 'All printed'
                            }
                            onClick={() => router.visit(songsIndex())}
                        />
                        <StatCard
                            icon={Folder}
                            label="Active folders"
                            value={stats.total_folders}
                            onClick={() => router.visit(foldersIndex())}
                        />
                    </div>
                </section>

                {/* ── Recently Added section ── */}
                {recentSongs.length > 0 && (
                    <section>
                        <SectionTitle className="px-4">Recently added</SectionTitle>
                        <div className="mx-4 rounded-xl border bg-card px-4 relative">
                            {recentSongs.map((song) => (
                                <RecentSongItem
                                    key={song.id}
                                    song={song}
                                    onClick={() => setDetailSong(song)}
                                />
                            ))}
                            {/* See all — centered on bottom border */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                                <button
                                    type="button"
                                    onClick={() => router.visit(songsIndex())}
                                    className="
                                        flex items-center gap-1.5 rounded-full border bg-card
                                        px-3 py-1 text-sm text-muted-foreground
                                        hover:text-foreground hover:border-foreground/30
                                        transition-colors cursor-pointer whitespace-nowrap
                                    "
                                >
                                    See all
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        {/* spacer untuk kompensasi button yang menonjol keluar */}
                        <div className="h-4" />
                    </section>
                )}

                {/* Quick actions */}
                <section>
                    <SectionTitle className="px-4">Quick actions</SectionTitle>
                    <QuickActions />
                </section>

            </div>

            {/* Song Detail Drawer — read only */}
            {detailSong && (
                <SideDrawer
                    open={!!detailSong}
                    onClose={() => setDetailSong(null)}
                    title={detailSong.title}
                    subtitle={detailSong.publisher ?? undefined}
                    headerExtra={
                        <StatusBadge status={detailSong.status} interactive={false} />
                    }
                    footer={
                        <Button
                            className="cursor-pointer w-full"
                            onClick={() => {
                                const songId = detailSong.id;
                                setDetailSong(null);
                                router.visit(songsIndex({ query: { edit: songId } }));
                            }}
                        >
                            Edit in Songs
                        </Button>
                    }
                >
                    <div className="flex flex-col divide-y divide-border">

                        {/* Core stats */}
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

                        {/* Notes */}
                        {detailSong.description && (
                            <div className="py-5">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                                    Notes
                                </p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {detailSong.description}
                                </p>
                            </div>
                        )}

                        {/* Sheet file */}
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
                                            hover:bg-muted/40 transition-colors cursor-pointer group"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {detailSong.sheet_file_name ?? 'Sheet file'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Open file</p>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                </a>
                            </div>
                        )}

                        {/* YouTube */}
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
            )}
        </AppLayout>
    );
}