<?php

namespace App\Http\Controllers;

use App\Http\Requests\Folder\StoreFolderRequest;
use App\Http\Requests\Folder\UpdateFolderRequest;
use App\Models\Folder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class FolderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('folders/index', [
            'folders' => Folder::withCount('songs')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreFolderRequest $request): RedirectResponse
    {
        Folder::create($request->validated());
        Cache::forget('active_folders');
        return back()->with('success', 'Folder created successfully.');
    }

    public function update(UpdateFolderRequest $request, Folder $folder): RedirectResponse
    {
        $folder->update($request->validated());
        Cache::forget('active_folders');
        return back()->with('success', 'Folder updated successfully.');
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        if ($folder->songs()->exists()) {
            return back()->withErrors(['delete' => 'There are songs in this folder. Cannot delete.']);
        }
        $folder->delete();
        Cache::forget('active_folders');
        return back()->with('success', 'Folder deleted successfully.');
    }
}