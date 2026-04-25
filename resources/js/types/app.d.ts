export type PrintStatus = 'printed' | 'not_printed';

export interface Folder {
    id: number;
    name: string;
    slug: string;
    color_code: string | null;
    is_active: boolean;
}

export interface Song {
    id: number;
    title: string;
    slig: string;
    description: string | null;
    publisher: string | null;
    page_number: number;
    status: PrintStatus;
    folder_id: number;
    user_id: number;
    folder?: Folder;
    author?: {
        id: number; name:string;
    };
    created_at: string;
    updated_at: string;
}

export interface PivotSong extends Song {
    pivot: {
        order: number;
        notes: string | null;
    };
}

export interface Schedule {
    id: number;
    event_name: string;
    slug: string;
    event_date: string;
    category: string;
    notes: string | null;
    is_published: boolean;
    copied_from_id: number | null;
    user_id: number;
    songs_count?: number;
    songs?: PivotSong[];
    creator?: {
        id: number;
        name: string;
    };
    copied_from?: Pick<Schedule, 'id' | 'event_name' | 'event_date'>;
}

export interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}
