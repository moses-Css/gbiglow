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
        Schema::create('songs', function (Blueprint $table) {
            $table->id();
            $table->string('title')->index();
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->string('publisher')->nullable()->index();
            $table->integer('page_number')->unsigned();
            $table->enum('status', ['printed', 'not_printed'])->default('not_printed')->index();
            $table->foreignId('folder_id')->constrained()->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['folder_id', 'status'], 'idx_songs_folder_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('songs');
    }
};
