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
        // Drop orphan table
        Schema::dropIfExists('schedule');

        Schema::table('schedules', function (Blueprint $table) {
            $table->enum('type', ['regular', 'multi_session'])
                ->default('regular')
                ->after('category');
            $table->string('color_primary', 7)
                ->nullable()
                ->after('type');
            $table->string('color_secondary', 7)
                ->nullable()
                ->after('color_primary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn(['type', 'color_primary', 'color_secondary']);
        });
    }
};
