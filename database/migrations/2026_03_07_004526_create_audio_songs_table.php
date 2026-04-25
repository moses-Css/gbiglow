<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audio_songs', function (Blueprint $table) {
            $table->id();
            $table->string('drive_id')->unique();
            $table->string('title');
            $table->unsignedInteger('duration')->nullable()->comment('Duration in seconds');
            $table->unsignedBigInteger('file_size')->nullable()->comment('File size in bytes');
            $table->string('mime_type')->default('audio/mpeg');
            $table->string('drive_url')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->enum('sync_status', ['synced', 'pending', 'error'])->default('pending');
            $table->timestamp('last_synced_at')->nullable();
            $table->foreignId('song_id')
                  ->nullable()
                  ->constrained('songs')
                  ->nullOnDelete();
            $table->timestamps();

            $table->index('sync_status');
            $table->index('song_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audio_songs');
    }
};
