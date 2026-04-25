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
        Schema::create('schedule_song', function (Blueprint $table) {
        $table->id();
        $table->foreignId('schedule_id')
            ->constrained()->onDelete('cascade');
        $table->foreignId('song_id')
            ->constrained()->onDelete('cascade');
        $table->unsignedSmallInteger('order')->default(0);
        $table->string('notes')->nullable();
        // Satu lagu tidak boleh duplikat dalam satu schedule
        $table->unique(['schedule_id', 'song_id'], 'uq_schedule_song');
        $table->index(['schedule_id', 'order'], 'idx_schedule_song_order');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_song');
    }
};
