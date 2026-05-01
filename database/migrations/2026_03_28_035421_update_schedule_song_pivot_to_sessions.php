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
        Schema::table('schedule_song', function (Blueprint $table) {
            // Conditional — index mungkin tidak ada di semua environment
            if (Schema::hasIndex('schedule_song', 'idx_schedule_song_order')) {
                $table->dropIndex('idx_schedule_song_order');
            }
            $table->dropColumn('schedule_id');

            $table->foreignId('session_id')
                ->after('id')
                ->constrained('schedule_sessions')
                ->cascadeOnDelete();

            $table->unique(['session_id', 'song_id'], 'uq_session_song');
            $table->index(['session_id', 'order'], 'idx_session_song_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_song', function (Blueprint $table) {
            $table->dropUnique('uq_session_song');
            $table->dropIndex('idx_session_song_order');
            $table->dropForeign(['session_id']);
            $table->dropColumn('session_id');

            $table->foreignId('schedule_id')
                ->after('id')
                ->constrained('schedules')
                ->cascadeOnDelete();

            $table->unique(['schedule_id', 'song_id'], 'uq_schedule_song');
            $table->index(['schedule_id', 'order'], 'idx_schedule_song_order');
        });
    }
};
