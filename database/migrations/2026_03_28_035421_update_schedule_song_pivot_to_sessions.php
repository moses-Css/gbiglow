<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedule_song', function (Blueprint $table) {
            if (Schema::hasIndex('schedule_song', 'idx_schedule_song_order')) {
                $table->dropIndex('idx_schedule_song_order');
            }
            if (Schema::hasColumn('schedule_song', 'schedule_id')) {
                $table->dropColumn('schedule_id');
            }
            if (!Schema::hasColumn('schedule_song', 'session_id')) {
                $table->foreignId('session_id')
                    ->after('id')
                    ->constrained('schedule_sessions')
                    ->cascadeOnDelete();
            }
            if (!Schema::hasIndex('schedule_song', 'uq_session_song')) {
                $table->unique(['session_id', 'song_id'], 'uq_session_song');
            }
            if (!Schema::hasIndex('schedule_song', 'idx_session_song_order')) {
                $table->index(['session_id', 'order'], 'idx_session_song_order');
            }
        });
    }

    public function down(): void
    {
        // Truncate required — existing rows reference session_id,
        // cannot restore schedule_id FK constraint with live data
        DB::table('schedule_song')->truncate();

        Schema::table('schedule_song', function (Blueprint $table) {
            if (Schema::hasIndex('schedule_song', 'idx_session_song_order')) {
                $table->dropIndex('idx_session_song_order');
            }
            if (Schema::hasIndex('schedule_song', 'uq_session_song')) {
                $table->dropUnique('uq_session_song');
            }
            if (Schema::hasColumn('schedule_song', 'session_id')) {
                $table->dropColumn('session_id');
            }
            if (!Schema::hasColumn('schedule_song', 'schedule_id')) {
                $table->unsignedBigInteger('schedule_id')->after('id');
                $table->foreign('schedule_id', 'schedule_song_schedule_id_foreign')
                    ->references('id')
                    ->on('schedules')
                    ->cascadeOnDelete();
            }
            if (!Schema::hasIndex('schedule_song', 'idx_schedule_song_order')) {
                $table->index(['schedule_id', 'order'], 'idx_schedule_song_order');
            }
        });
    }
};