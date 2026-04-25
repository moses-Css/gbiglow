<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ScheduleSession extends Model
{
    protected $fillable = [
        'schedule_id',
        'label',
        'order',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function songs(): BelongsToMany
    {
        return $this->belongsToMany(Song::class, 'schedule_song', 'session_id', 'song_id')
            ->withPivot(['order', 'notes'])
            ->orderByPivot('order');
    }
}