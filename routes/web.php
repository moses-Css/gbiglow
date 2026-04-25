<?php

use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SongController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\AudioSongController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Settings\AppearanceController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorController;



Route::get('/', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Admin-only routes
Route::middleware(['auth', 'verified', 'admin'])->group(function () {

     // Bulk route
     Route::post('songs/bulk', [SongController::class, 'bulkStore'])->name('songs.bulk-store');
     Route::post('songs/bulk-check-duplicates', [SongController::class, 'bulkCheckDuplicates'])->name('songs.bulk-check-duplicates');
     // Duplicate Checker
     Route::get('songs/suggestions', [SongController::class, 'suggestions'])->name('songs.suggestions');
     Route::get('songs/check-duplicate', [SongController::class, 'checkDuplicate'])->name('songs.check-duplicate');
     Route::get('songs/check-page-conflict', [SongController::class, 'checkPageConflict'])->name('songs.check-page-conflict');

     // Audio resource route
     Route::get('audio-songs/suggestions', [AudioSongController::class, 'suggestions'])->name('audio-songs.suggestions');
     Route::get('audio-songs/sync-status', [AudioSongController::class, 'syncStatus'])->name('audio-songs.sync-status');
     Route::get('audio-songs', [AudioSongController::class, 'index'])->name('audio-songs.index');
     Route::post('audio-songs/sync', [AudioSongController::class, 'sync'])->name('audio-songs.sync');
     Route::get('audio-songs/{audioSong}/stream-url', [AudioSongController::class, 'streamUrl'])->name('audio-songs.stream-url');
     Route::post('audio-songs/{audioSong}/link-song', [AudioSongController::class, 'linkSong'])->name('audio-songs.link-song');
     Route::post('audio-songs/{audioSong}/unlink-song', [AudioSongController::class, 'unlinkSong'])->name('audio-songs.unlink-song');

     //Bulk Delete
     Route::delete('songs/bulk-destroy', [SongController::class, 'bulkDestroy'])->name('songs.bulk-destroy');

    // Songs — SPA modal, tidak butuh route create/edit/show
     Route::resource('songs', SongController::class)
              ->except(['create', 'edit', 'show']);
     Route::patch('songs/{song}/toggle-status', [SongController::class, 'toggleStatus'])
         ->name('songs.toggle-status');

    // Schedules
    Route::resource('schedules', ScheduleController::class)
         ->except(['create', 'edit']);
    Route::post('schedules/{schedule}/copy', [ScheduleController::class, 'copy'])
         ->name('schedules.copy');

     //Folder
     Route::resource('folders', FolderController::class)
      ->except(['create', 'edit', 'show']);

     Route::get('/settings/profile',    [ProfileController::class,    'edit'])->name('profile.edit');
     Route::get('/settings/password',   [PasswordController::class,   'edit'])->name('user-password.edit');
     Route::get('/settings/appearance', [AppearanceController::class, 'edit'])->name('appearance.edit');
     Route::get('/settings/two-factor', [TwoFactorController::class,  'show'])->name('two-factor.show');

});
