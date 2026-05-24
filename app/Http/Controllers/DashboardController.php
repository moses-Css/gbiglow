<?php

namespace App\Http\Controllers;
use App\Models\Folder;
use App\Models\Schedule;
use App\Models\Song;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stats = [
            'total_songs'  => Song::count(),
            'total_folders' => Folder::where('is_active', true)->count(),
            'printed'      => Song::printed()->count(),
            'not_printed'  => Song::notPrinted()->count(),
        ];
 
        $thisWeekSchedules = Schedule::query()
            ->with([
                'sessions.songs.folder:id,name,color_code',
                'creator:id,name',
            ])
            ->whereBetween('event_date', [
                now()->startOfDay(),
                now()->addDays(7)->endOfDay(),
            ])
            ->orderBy('event_date')
            ->get();
 
        $recentSongs = Song::query()
            ->select([
                'id', 'title', 'publisher', 'status',
                'folder_id', 'created_at', 'page_number',
                'description', 'youtube_link',
                'sheet_file_path', 'sheet_file_name', 'sheet_file_mime',
            ])
            ->with('folder:id,name,color_code')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();
 
        return Inertia::render('dashboard', [
            'stats'             => $stats,
            'thisWeekSchedules' => $thisWeekSchedules,
            'recentSongs'       => $recentSongs,
        ]);
    }
}
