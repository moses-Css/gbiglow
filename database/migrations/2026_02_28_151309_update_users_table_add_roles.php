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
        Schema::table('users', function (Blueprint $table) {

            // rename name jadi username (optional tapi lebih clean)
            $table->string('username', 50)->unique()->after('id');

            // main system role
            $table->enum('main_role', ['user', 'admin'])
                  ->default('user')
                  ->after('password');

            // active status
            $table->boolean('is_active')
                  ->default(true);

            // soft delete
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
            $table->dropColumn('main_role');
            $table->dropColumn('is_active');
            $table->dropSoftDeletes();
        });
    }
};
