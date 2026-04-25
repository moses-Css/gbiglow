<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    protected $fillable = [
        'type', 'status', 'total',
        'processed', 'error_message',
        'started_at', 'completed_at',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function getProgressPercentAttribute(): int
    {
        if (!$this->total) return 0;
        return (int) round(($this->processed / $this->total) * 100);
    }
}