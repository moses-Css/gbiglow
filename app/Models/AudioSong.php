<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AudioSong extends Model
{
    protected $fillable = [
        'drive_id',
        'title',
        'duration',
        'file_size',
        'mime_type',
        'drive_url',
        'thumbnail_url',
        'sync_status',
        'last_synced_at',
        'song_id',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
        'duration'       => 'integer',
        'file_size'      => 'integer',
    ];

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }

    public function getDurationFormattedAttribute(): string
    {
        if (!$this->duration) return '—';
        $m = floor($this->duration / 60);
        $s = $this->duration % 60;
        return sprintf('%d:%02d', $m, $s);
    }

    public function getFileSizeFormattedAttribute(): string
    {
        if (!$this->file_size) return '—';
        $mb = $this->file_size / 1048576;
        return number_format($mb, 1) . ' MB';
    }

    public function scopeSearch($query, string $term)
    {
        $normalized = preg_replace('/[\s\-\_\.]+/', '', strtolower($term));

        return $query->where(function ($q) use ($term, $normalized) {
            $q->where('title', 'like', "%{$term}%")
            ->orWhereRaw("REPLACE(LOWER(title), ' ', '') LIKE ?", ["%{$normalized}%"]);
        });
    }
}