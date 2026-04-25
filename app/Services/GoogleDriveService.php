<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\LazyCollection;

class GoogleDriveService
{
    private Drive $drive;

    private const CACHE_KEY   = 'gdrive_audio_files';
    private const CACHE_TTL   = 300; // 5 minutes
    private const AUDIO_MIMES = ['audio/mpeg', 'audio/mp3', 'audio/x-mp3', 'audio/wav', 'audio/ogg'];

    public function __construct()
    {
        $client = new Client();
        $client->setAuthConfig([
            'type'          => 'service_account',
            'project_id'    => config('services.google_drive.project_id'),
            'private_key_id'=> config('services.google_drive.private_key_id'),
            'private_key'   => str_replace('\\n', "\n", config('services.google_drive.private_key')),
            'client_email'  => config('services.google_drive.client_email'),
            'client_id'     => config('services.google_drive.client_id'),
            'auth_uri'      => 'https://accounts.google.com/o/oauth2/auth',
            'token_uri'     => 'https://oauth2.googleapis.com/token',
        ]);
        $client->setScopes([Drive::DRIVE_READONLY]);

        $this->drive = new Drive($client);
    }

    /**
     * Fetch audio files. forceRefresh bypasses cache.
     * Returns a LazyCollection to handle large folders without memory issues.
     */
    public function fetchAudioFiles(bool $forceRefresh = false): LazyCollection
    {
        $folderId = config('services.google_drive.folder_id');

        if ($forceRefresh) {
            Cache::forget(self::CACHE_KEY);
        }

        $files = Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL,
            fn () => $this->paginateDriveFiles($folderId)
        );

        return LazyCollection::make(function () use ($files) {
            foreach ($files as $file) {
                yield $this->normalizeFile($file);
            }
        });
    }

    /**
     * Get all drive IDs currently in the folder.
     * Used for hard-sync stale detection.
     */
    public function fetchDriveIds(): array
    {
        $folderId = config('services.google_drive.folder_id');
        $files    = $this->paginateDriveFiles($folderId);

        return array_map(fn (DriveFile $f) => $f->getId(), $files);
    }

    /**
     * Paginates through all files in folder. Handles folders with 1000+ files.
     */
    private function paginateDriveFiles(string $folderId): array
    {
        $files     = [];
        $pageToken = null;
        $mimeQuery = implode(' or ', array_map(
            fn ($m) => "mimeType='{$m}'",
            self::AUDIO_MIMES
        ));

        do {
            $params = [
                'q'        => "'{$folderId}' in parents and ({$mimeQuery}) and trashed=false",
                'fields' => 'nextPageToken, files(id, name, size, mimeType, createdTime, webViewLink, thumbnailLink)',
                'pageSize' => 100,
                'orderBy'  => 'name',
            ];

            if ($pageToken) {
                $params['pageToken'] = $pageToken;
            }

            $response  = $this->drive->files->listFiles($params);
            $files     = array_merge($files, $response->getFiles());
            $pageToken = $response->getNextPageToken();

        } while ($pageToken);

        return $files;
    }

    public function getStreamUrl(string $driveId): string
    {
        return "https://drive.google.com/uc?export=download&id={$driveId}";
    }

    private function normalizeFile(DriveFile $file): array
    {
        return [
            'drive_id'      => $file->getId(),
            'title'         => pathinfo($file->getName(), PATHINFO_FILENAME),
            'file_size'     => (int) $file->getSize(),
            'mime_type'     => $file->getMimeType(),
            'drive_url'     => $file->getWebViewLink(),
            'thumbnail_url' => $file->getThumbnailLink(),
            'duration'      => null, // Drive API v3 tidak support audio duration
        ];
    }
}