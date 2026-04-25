export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type PrintStatus = 'printed' | 'not_printed';
export type ScheduleType = 'regular' | 'multi_session';

export interface Folder {
    id: number;
    name: string;
    slug: string;
    color_code: string | null;
    description: string | null;
    is_active: boolean;
    songs_count?: number;
}

export interface Song {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    publisher: string | null;
    page_number: number;
    status: PrintStatus;
    folder_id: number;
    user_id: number;
    folder?: Folder;
    author?: { id: number; name: string };
    created_at: string;
    updated_at: string;
    youtube_link?: string;
    sheet_file_url?: string;
    sheet_file_name?: string;
}

export interface PivotSong extends Song {
    pivot: {
        order: number;
        notes: string | null;
    };
}

// Song dalam context session — extends Song dengan pivot data
export interface SessionSong extends Song {
    pivot: {
        order: number;
        notes: string | null;
    };
}

export interface ScheduleSession {
    id: number;
    schedule_id: number;
    label: string;
    order: number;
    songs: SessionSong[];
    created_at: string;
    updated_at: string;
}

export interface Schedule {
    id: number;
    event_name: string;
    slug: string;
    event_date: string;
    category: string;
    type: ScheduleType;
    color_primary: string | null;
    color_secondary: string | null;
    notes: string | null;
    is_published: boolean;
    copied_from_id: number | null;
    user_id: number;
    sessions?: ScheduleSession[];
    sessions_count?: number;
    creator?: { id: number; name: string };
    copied_from?: Pick<Schedule, 'id' | 'event_name' | 'event_date'>;
    created_at: string;
    updated_at: string;
}

export interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number;
    to: number;
}

export interface SongForm {
    title:        string;
    description:  string;
    publisher:    string;
    page_number:  string;
    status:       PrintStatus;
    folder_id:    string;
    force_action: string;
    youtube_link: string;
    sheet_file:   File | null;
    [key: string]: string | File | null;
}

export interface FolderForm {
    name:        string;
    color_code:  string;
    description: string;
    is_active:   boolean;
    [key: string]: string | boolean;
}

export interface ScheduleForm {
    event_name:      string;
    event_date:      string;
    category:        string;
    type:            ScheduleType;
    color_primary:   string;
    color_secondary: string;
    notes:           string;
    is_published:    boolean;
    copied_from_id:  string;
    [key: string]: string | boolean;
}