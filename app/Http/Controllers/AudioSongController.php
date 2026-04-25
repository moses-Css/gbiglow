<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGoogleDriveAudio;
use App\Models\AudioSong;
use App\Models\Song;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AudioSongController extends Controller
{
    public function index(Request $request): Response
    {
        $audioSongs = AudioSong::with('song.folder')
            ->when($request->filled('search'), fn($q) => $q->search($request->string('search')))
            ->orderBy('title')
            ->paginate(30)
            ->withQueryString();

        $songs = Song::with('folder')
            ->orderBy('title')
            ->get(['id', 'title', 'publisher', 'folder_id']);

        $counts = AudioSong::selectRaw("
            COUNT(*) as total,
            SUM(sync_status = 'synced') as synced,
            SUM(sync_status = 'pending') as pending,
            SUM(song_id IS NOT NULL) as linked
        ")->first();

        $stats = [
            'total'   => (int) $counts->total,
            'synced'  => (int) $counts->synced,
            'pending' => (int) $counts->pending,
            'linked'  => (int) $counts->linked,
        ];

        return Inertia::render('audio/index', [
            'audioSongs' => $audioSongs,
            'songs'      => $songs,
            'stats'      => $stats,
            'filters'    => $request->only(['search']),
        ]);
    }

    public function suggestions(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = $request->string('q');
        if (strlen($q) < 2) return response()->json([]);

        $normalized = preg_replace('/[\s\-\_\.]+/', '', strtolower($q));

        $results = AudioSong::select('title')
            ->where(function ($query) use ($q, $normalized) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhereRaw("REPLACE(LOWER(title), ' ', '') LIKE ?", ["%{$normalized}%"]);
            })
            ->distinct()
            ->limit(8)
            ->pluck('title');

        return response()->json($results);
    }

    public function sync(): JsonResponse
    {
        SyncGoogleDriveAudio::dispatch(forceRefresh: true);

        return response()->json(['message' => 'Sync started! This may take a moment.']);
    }

    public function linkSong(Request $request, AudioSong $audioSong): JsonResponse
    {
        $request->validate([
            'song_id' => ['required', 'integer', 'exists:songs,id'],
        ]);

        $audioSong->update(['song_id' => $request->song_id]);

        return response()->json(['message' => 'Linked successfully.']);
    }

    public function unlinkSong(AudioSong $audioSong): JsonResponse
    {
        $audioSong->update(['song_id' => null]);

        return response()->json(['message' => 'Unlinked.']);
    }

    public function streamUrl(AudioSong $audioSong, GoogleDriveService $driveService): JsonResponse
    {
        return response()->json([
            'url' => $driveService->getStreamUrl($audioSong->drive_id),
        ]);
    }

    public function syncStatus(): \Illuminate\Http\JsonResponse
    {
        $latest = \App\Models\SyncLog::where('type', 'google_drive')
            ->latest()
            ->first();

        return response()->json([
            'status'    => $latest?->status ?? 'idle',
            'progress'  => $latest?->progress_percent ?? 0,
            'total'     => $latest?->total ?? 0,
            'processed' => $latest?->processed ?? 0,
        ]);
    }
}