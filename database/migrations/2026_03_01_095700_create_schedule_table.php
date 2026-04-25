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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('event_name');
            $table->string('slug')->unique();
            $table->date('event_date')->index();
            $table->string('category')->index();
            $table->text('notes')->nullable();
            $table->boolean('is_published')->default(false);
            // Self-ref FK: untuk fitur "copy dari schedule lain"
            $table->foreignId('copied_from_id')
                ->nullable()->constrained('schedules')->onDelete('set null');
            $table->foreignId('user_id')
                ->constrained()->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule');
    }
};
