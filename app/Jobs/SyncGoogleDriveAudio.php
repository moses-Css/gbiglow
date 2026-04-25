<?php

namespace App\Jobs;

use App\Models\AudioSong;
use App\Services\GoogleDriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncGoogleDriveAudio implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries   = 3;

    public function __construct(private bool $forceRefresh = false) {}

    public function handle(GoogleDriveService $driveService): void
    {
        $log = \App\Models\SyncLog::create([
            'type'       => 'google_drive',
            'status'     => 'processing',
            'started_at' => now(),
        ]);

        try {
            $files = $driveService->fetchAudioFiles(forceRefresh: $this->forceRefresh);
            $total = $files->count();
            $log->update(['total' => $total]);

            // ── Upsert semua file dari Drive
            $activeDriveIds = [];
            $processed = 0;

            foreach ($files as $fileData) {
                \App\Models\AudioSong::updateOrCreate(
                    ['drive_id' => $fileData['drive_id']],
                    [...$fileData, 'sync_status' => 'synced', 'last_synced_at' => now()]
                );

                $activeDriveIds[] = $fileData['drive_id'];
                $processed++;

                if ($processed % 10 === 0) {
                    $log->update(['processed' => $processed]);
                }
            }

            // ── Hard sync: hapus record yang drive_id-nya sudah tidak ada di Drive
            \App\Models\AudioSong::whereNotIn('drive_id', $activeDriveIds)->delete();

            $log->update([
                'status'       => 'completed',
                'processed'    => $total,
                'completed_at' => now(),
            ]);

        } catch (\Throwable $e) {
            $log->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at'  => now(),
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error('[AudioSync] Job failed: ' . $e->getMessage());
    }
}