<?php

namespace App\Http\Controllers;

use App\Http\Requests\Song\BulkCheckDuplicatesRequest;
use App\Http\Requests\Song\BulkDestroySongRequest;
use App\Http\Requests\Song\BulkStoreSongRequest;
use App\Http\Requests\Song\CheckDuplicateRequest;
use App\Http\Requests\Song\CheckPageConflictRequest;
use App\Http\Requests\Song\StoreSongRequest;
use App\Http\Requests\Song\SuggestionsRequest;
use App\Http\Requests\Song\UpdateSongRequest;
use App\Models\Folder;
use App\Models\Song;
use App\Services\SongService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SongController extends Controller
{
    public function __construct(private readonly SongService $songService) {}

    public function index(Request $request): Response
    {
        $songs = Song::query()
            ->select([
                'id', 'title', 'slug', 'description', 'publisher',
                'page_number', 'status', 'folder_id', 'user_id',
                'youtube_link', 'sheet_file_path', 'sheet_file_name', 'sheet_file_mime',
                'created_at',
            ])
            ->with(['folder:id,name,color_code'])
            ->when($request->filled('search'), fn($q) => $q->search($request->string('search')))
            ->when($request->filled('folder'), fn($q) => $q->where('folder_id', $request->integer('folder')))
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->string('status')))
            ->orderBy('folder_id', 'asc')
            ->orderBy('page_number', 'asc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('songs/index', [
            'songs'   => $songs,
            'filters' => $request->only(['search', 'folder', 'status']),
            'folders' => Cache::remember('active_folders', 300, fn() =>
                Folder::select(['id', 'name', 'color_code'])
                    ->where('is_active', true)
                    ->get()
            ),
        ]);
    }

    public function store(StoreSongRequest $request): RedirectResponse
    {
        $file = $request->hasFile('sheet_file') ? $request->file('sheet_file') : null;

        $this->songService->createSong(
            $request->validated(),
            $request->user()->id,
            $file
        );

        return back();
    }

    public function update(UpdateSongRequest $request, Song $song): RedirectResponse
    {
        $data = $request->validated();
        $file = $request->hasFile('sheet_file') ? $request->file('sheet_file') : null;

        $this->songService->updateSong($song, $data, $file);

        return back();
    }

    public function destroy(Song $song): RedirectResponse
    {
        $this->songService->deleteSheetFile($song);
        $song->delete();

        return back();
    }

    public function toggleStatus(Song $song): RedirectResponse
    {
        $song->update([
            'status' => $song->status === 'printed' ? 'not_printed' : 'printed',
        ]);

        return back();
    }

    // ── Bulk ──────────────────────────────────────────────────────────────────

    public function bulkStore(BulkStoreSongRequest $request): JsonResponse
    {
        $result = $this->songService->bulkCreate(
            $request->validated()['songs'],
            $request->user()->id
        );

        return response()->json($result);
    }

    public function bulkDestroy(BulkDestroySongRequest $request): RedirectResponse
    {
        $songs = Song::whereIn('id', $request->validated()['ids'])->get();

        foreach ($songs as $song) {
            $this->songService->deleteSheetFile($song);
            $song->delete();
        }

        return back();
    }

    public function bulkCheckDuplicates(BulkCheckDuplicatesRequest $request): JsonResponse
    {
        $songs    = $request->validated()['songs'];
        $titles   = array_column($songs, 'title');
        $existing = Song::whereIn('title', $titles)
            ->select('title', 'publisher')
            ->get()
            ->mapWithKeys(fn($s) => [$s->title . '||' . ($s->publisher ?? '') => true]);

        $duplicates = [];
        foreach ($songs as $song) {
            $key = $song['title'] . '||' . ($song['publisher'] ?? '');
            if ($existing->has($key)) {
                $duplicates[] = $key;
            }
        }

        return response()->json(['duplicates' => $duplicates]);
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    public function checkPageConflict(CheckPageConflictRequest $request): JsonResponse
    {
        $conflict = Song::where('folder_id', $request->integer('folder_id'))
            ->where('page_number', $request->integer('page_number'))
            ->when($request->filled('exclude_id'), fn($q) =>
                $q->where('id', '!=', $request->integer('exclude_id'))
            )
            ->select('id', 'title')
            ->first();

        return response()->json(['conflict' => $conflict]);
    }

    public function checkDuplicate(CheckDuplicateRequest $request): JsonResponse
    {
        $exists = Song::where('title', $request->string('title'))
            ->where(function ($q) use ($request) {
                $publisher = $request->string('publisher')->toString();
                if ($publisher) {
                    $q->where('publisher', $publisher);
                } else {
                    $q->whereNull('publisher')->orWhere('publisher', '');
                }
            })
            ->exists();

        return response()->json(['duplicate' => $exists]);
    }

    public function suggestions(SuggestionsRequest $request): JsonResponse
    {
        $field      = $request->string('field')->toString();
        $q          = $request->string('q')->toString();
        $normalized = Song::normalize($q);

        $results = Song::select($field)
            ->where(function ($query) use ($field, $q, $normalized) {
                $query->where($field, 'like', "%{$q}%")
                    ->orWhereRaw("REPLACE(LOWER({$field}), ' ', '') LIKE ?", ["%{$normalized}%"]);
            })
            ->distinct()
            ->limit(8)
            ->pluck($field);

        return response()->json($results);
    }
}