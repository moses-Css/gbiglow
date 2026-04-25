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
        Schema::table('songs', function (Blueprint $table) {
            $table->string('youtube_link')->nullable()->after('description');
            $table->string('sheet_file_path')->nullable()->after('youtube_link');
            $table->string('sheet_file_name')->nullable()->after('sheet_file_path');
            $table->string('sheet_file_mime')->nullable()->after('sheet_file_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn(['youtube_link', 'sheet_file_path', 'sheet_file_name', 'sheet_file_mime']);
        });
    }
};
