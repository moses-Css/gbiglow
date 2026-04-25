<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class Song extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'publisher',
        'page_number',
        'status',
        'folder_id',
        'user_id',
        'youtube_link',
        'sheet_file_path',
        'sheet_file_name',
        'sheet_file_mime',
    ];

    protected $appends = ['sheet_file_url'];

    protected static function booted(): void
    {
        static::creating(fn(Song $s) =>
            $s->slug = Str::slug($s->title) . '-' . Str::random(6)
        );
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeSearch($query, string $term)
    {
        $normalized = self::normalize($term);

        return $query->where(function ($q) use ($term, $normalized) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('publisher', 'like', "%{$term}%")
              ->orWhereRaw("REPLACE(LOWER(title), ' ', '') LIKE ?", ["%{$normalized}%"])
              ->orWhereRaw("REPLACE(LOWER(publisher), ' ', '') LIKE ?", ["%{$normalized}%"]);
        });
    }

    public function scopePrinted($q)
    {
        return $q->where('status', 'printed');
    }

    public function scopeNotPrinted($q)
    {
        return $q->where('status', 'not_printed');
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getSheetFileUrlAttribute(): ?string
    {
        return $this->sheet_file_path
            ? Storage::url($this->sheet_file_path)
            : null;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function schedules(): BelongsToMany
    {
        return $this->belongsToMany(Schedule::class, 'schedule_song')
            ->withPivot(['order', 'notes'])
            ->orderByPivot('order');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public static function normalize(string $term): string
    {
        return preg_replace('/[\s\-\_\.]+/', '', strtolower($term));
    }
}