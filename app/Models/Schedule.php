<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Schedule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'event_name',
        'slug',
        'event_date',
        'category',
        'type',
        'color_primary',
        'color_secondary',
        'notes',
        'is_published',
        'copied_from_id',
        'user_id',
    ];

    protected $casts = [
        'event_date'   => 'date',
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(fn(Schedule $s) =>
            $s->slug = Str::slug($s->event_name) . '-' . $s->event_date->format('Y-m-d') . '-' . Str::random(4)
        );
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function sessions(): HasMany
    {
        return $this->hasMany(ScheduleSession::class)->orderBy('order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function copiedFrom(): BelongsTo
    {
        return $this->belongsTo(Schedule::class, 'copied_from_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function inheritSongsFrom(Schedule $source): void
    {
        $sourceSessions = $source->sessions()->with('songs')->get();

        foreach ($sourceSessions as $sourceSession) {
            $newSession = $this->sessions()->create([
                'label' => $sourceSession->label,
                'order' => $sourceSession->order,
            ]);

            $pivot = $sourceSession->songs
                ->mapWithKeys(fn($song) => [
                    $song->id => [
                        'order' => $song->pivot->order,
                        'notes' => $song->pivot->notes,
                    ],
                ])->toArray();

            $newSession->songs()->sync($pivot);
        }

        $this->update(['copied_from_id' => $source->id]);
    }
}