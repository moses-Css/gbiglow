<?php

namespace App\Http\Controllers;

use App\Http\Requests\Folder\StoreFolderRequest;
use App\Http\Requests\Folder\UpdateFolderRequest;
use App\Models\Folder;
use Illuminate\Http\RedirectResponse;
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
        return back()->with('success', 'Folder berhasil dibuat.');
    }

    public function update(UpdateFolderRequest $request, Folder $folder): RedirectResponse
    {
        $folder->update($request->validated());
        return back()->with('success', 'Folder berhasil diupdate.');
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        if ($folder->songs()->exists()) {
            return back()->withErrors(['delete' => 'Folder masih memiliki lagu, tidak bisa dihapus.']);
        }
        $folder->delete();
        return back()->with('success', 'Folder berhasil dihapus.');
    }
}