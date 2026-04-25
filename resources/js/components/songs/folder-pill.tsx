import type { Song } from '@/types';

interface FolderPillProps {
    folder: Song['folder'];
}

export default function FolderPill({ folder }: FolderPillProps) {
    if (!folder) return null;

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {folder.color_code && (
                <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: folder.color_code }}
                />
            )}
            {folder.name}
        </span>
    );
}