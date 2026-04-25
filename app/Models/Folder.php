<?php

namespace App\Models;

use App\Models\Song;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;

class Folder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'color_code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Folder $folder): void {
            $folder->slug = Str::slug($folder->name);
        });

        static::updating(function (Folder $folder): void {
            if ($folder->isDirty('name')) {
                $folder->slug = Str::slug($folder->name);
            }
        });
    }

    public function songs(): HasMany
    {
        return $this->hasMany(Song::class);
    }
}