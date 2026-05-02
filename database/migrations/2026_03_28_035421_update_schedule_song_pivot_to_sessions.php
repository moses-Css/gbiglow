<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function getForeignKeys(string $table): array
    {
        return array_column(DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        ", [$table]), 'CONSTRAINT_NAME');
    }

    private function getIndexes(string $table): array
    {
        return array_column(DB::select("
            SELECT DISTINCT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
        ", [$table]), 'INDEX_NAME');
    }

    private function getColumns(string $table): array
    {
        return array_column(DB::select("
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
        ", [$table]), 'COLUMN_NAME');
    }

    public function up(): void
    {
        $fks     = $this->getForeignKeys('schedule_song');
        $indexes = $this->getIndexes('schedule_song');
        $columns = $this->getColumns('schedule_song');

        // Step 1 — Drop FKs first (always before indexes)
        if (in_array('schedule_song_schedule_id_foreign', $fks)) {
            DB::statement('ALTER TABLE `schedule_song` DROP FOREIGN KEY `schedule_song_schedule_id_foreign`');
        }

        // Step 2 — Drop indexes
        if (in_array('uq_schedule_song', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` DROP INDEX `uq_schedule_song`');
        }
        if (in_array('idx_schedule_song_order', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` DROP INDEX `idx_schedule_song_order`');
        }

        // Step 3 — Drop column
        if (in_array('schedule_id', $columns)) {
            DB::statement('ALTER TABLE `schedule_song` DROP COLUMN `schedule_id`');
        }

        // Step 4 — Add session_id with FK
        if (!in_array('session_id', $this->getColumns('schedule_song'))) {
            DB::statement('ALTER TABLE `schedule_song` ADD COLUMN `session_id` BIGINT UNSIGNED NOT NULL AFTER `id`');
            DB::statement('ALTER TABLE `schedule_song` ADD CONSTRAINT `schedule_song_session_id_foreign` FOREIGN KEY (`session_id`) REFERENCES `schedule_sessions` (`id`) ON DELETE CASCADE');
        }

        // Step 5 — Add indexes
        $indexes = $this->getIndexes('schedule_song');
        if (!in_array('uq_session_song', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` ADD UNIQUE KEY `uq_session_song` (`session_id`, `song_id`)');
        }
        if (!in_array('idx_session_song_order', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` ADD INDEX `idx_session_song_order` (`session_id`, `order`)');
        }
    }

    public function down(): void
    {
        $fks     = $this->getForeignKeys('schedule_song');
        $indexes = $this->getIndexes('schedule_song');
        $columns = $this->getColumns('schedule_song');

        // Truncate — cannot restore schedule_id FK with live session-based data
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('schedule_song')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Step 1 — Drop FKs first
        if (in_array('schedule_song_session_id_foreign', $fks)) {
            DB::statement('ALTER TABLE `schedule_song` DROP FOREIGN KEY `schedule_song_session_id_foreign`');
        }

        // Step 2 — Drop indexes
        if (in_array('uq_session_song', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` DROP INDEX `uq_session_song`');
        }
        if (in_array('idx_session_song_order', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` DROP INDEX `idx_session_song_order`');
        }

        // Step 3 — Drop column
        if (in_array('session_id', $columns)) {
            DB::statement('ALTER TABLE `schedule_song` DROP COLUMN `session_id`');
        }

        // Step 4 — Restore schedule_id
        if (!in_array('schedule_id', $this->getColumns('schedule_song'))) {
            DB::statement('ALTER TABLE `schedule_song` ADD COLUMN `schedule_id` BIGINT UNSIGNED NOT NULL AFTER `id`');
            DB::statement('ALTER TABLE `schedule_song` ADD CONSTRAINT `schedule_song_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE');
        }

        // Step 5 — Restore indexes
        $indexes = $this->getIndexes('schedule_song');
        if (!in_array('uq_schedule_song', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` ADD UNIQUE KEY `uq_schedule_song` (`schedule_id`, `song_id`)');
        }
        if (!in_array('idx_schedule_song_order', $indexes)) {
            DB::statement('ALTER TABLE `schedule_song` ADD INDEX `idx_schedule_song_order` (`schedule_id`, `order`)');
        }
    }
};