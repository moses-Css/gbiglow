<?php

namespace App\Services;

use App\Models\Song;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class SongService
{
    // ── File handling ─────────────────────────────────────────────────────────

    public function storeSheetFile(UploadedFile $file): array
    {
        return [
            'sheet_file_path' => $file->store('songs/sheets', 'public'),
            'sheet_file_name' => $file->getClientOriginalName(),
            'sheet_file_mime' => $file->getMimeType(),
        ];
    }

    public function deleteSheetFile(Song $song): void
    {
        if ($song->sheet_file_path) {
            Storage::disk('public')->delete($song->sheet_file_path);
        }
    }

    // ── Single CRUD ───────────────────────────────────────────────────────────

    public function createSong(array $data, int $userId, ?UploadedFile $file = null): Song
    {
        $data['user_id'] = $userId;
        $forceAction     = $data['force_action'] ?? null;

        unset($data['force_action'], $data['sheet_file']);

        if ($file) {
            $data = array_merge($data, $this->storeSheetFile($file));
        }

        if ($forceAction) {
            $existing = $this->findExistingByTitlePublisher(
                $data['title'],
                $data['publisher'] ?? null
            );

            if ($existing && $forceAction === 'overwrite') {
                $this->deleteSheetFile($existing);
                $existing->update($data);
                return $existing->fresh();
            }

            if ($forceAction === 'make_version') {
                $data['title'] = $this->makeVersionTitle(
                    $data['title'],
                    $data['publisher'] ?? null
                );
            }
        }

        return Song::create($data);
    }

    public function updateSong(Song $song, array $data, ?UploadedFile $file = null): Song
    {
        if ($file) {
            $this->deleteSheetFile($song);
            $data = array_merge($data, $this->storeSheetFile($file));
        }

        unset($data['sheet_file']);
        $song->update($data);

        return $song->fresh();
    }

    // ── Bulk ──────────────────────────────────────────────────────────────────

    public function bulkCreate(array $rows, int $userId): array
    {
        $created   = 0;
        $skipped   = 0;
        $allTitles = array_column($rows, 'title');

        $existingMap = Song::whereIn('title', $allTitles)
            ->select('id', 'title', 'publisher', 'status', 'folder_id', 'page_number')
            ->get()
            ->keyBy(fn(Song $s) => $s->title . '||' . ($s->publisher ?? ''));

        foreach ($rows as $row) {
            $forceAction = $row['force_action'] ?? null;
            $songData    = array_diff_key($row, ['force_action' => null]);
            $key         = $row['title'] . '||' . ($row['publisher'] ?? '');
            $existing    = $existingMap[$key] ?? null;

            if ($existing) {
                if ($forceAction === 'overwrite') {
                    $existing->update($songData);
                    $created++;
                } elseif ($forceAction === 'make_version') {
                    Song::create([
                        ...$songData,
                        'title'   => $this->makeVersionTitle($row['title'], $row['publisher'] ?? null),
                        'user_id' => $userId,
                    ]);
                    $created++;
                } else {
                    $skipped++;
                }
                continue;
            }

            Song::create([...$songData, 'user_id' => $userId]);
            $created++;
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'total'   => count($rows),
        ];
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function findExistingByTitlePublisher(string $title, ?string $publisher): ?Song
    {
        return Song::where('title', $title)
            ->where(function ($q) use ($publisher) {
                if ($publisher) {
                    $q->where('publisher', $publisher);
                } else {
                    $q->whereNull('publisher')->orWhere('publisher', '');
                }
            })
            ->first();
    }

    private function makeVersionTitle(string $title, ?string $publisher): string
    {
        $count = Song::where('title', 'like', $title . '%')
            ->where(function ($q) use ($publisher) {
                if ($publisher) {
                    $q->where('publisher', $publisher);
                } else {
                    $q->whereNull('publisher')->orWhere('publisher', '');
                }
            })
            ->count();

        return $title . ' (Ver. ' . ($count + 1) . ')';
    }
}