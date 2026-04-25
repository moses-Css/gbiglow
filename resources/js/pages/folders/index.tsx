import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Field from '@/components/ui/field';
import { Plus, MoreHorizontal, Music } from 'lucide-react';
import { useFlash } from '@/components/flash-toast';
import { useFolderForm } from '@/hooks/folders/useFolderForm';
import { PRESET_COLORS } from '@/lib/colors';
import type { Folder } from '@/types';

interface Props {
    folders: Folder[];
}

export default function FoldersIndex({ folders }: Props) {
    const { flash }  = useFlash();

    const {
        data, setData, processing, errors,
        open, editFolder,
        deleteTarget, setDeleteTarget,
        openCreate, openEdit, handleClose,
        handleSubmit, handleDelete, confirmDelete,
    } = useFolderForm({ flash });

    return (
        <AppLayout>
            <Head title="Folders" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Folders</h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola kategori & warna folder lagu
                        </p>
                    </div>
                    <Button onClick={openCreate} className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> Buat Folder
                    </Button>
                </div>

                {/* Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {folders.map((folder) => (
                        <div key={folder.id}
                            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                            <span className="h-4 w-4 rounded-full flex-shrink-0 ring-1 ring-black/10"
                                style={{ backgroundColor: folder.color_code ?? '#6B7280' }} />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{folder.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Music className="h-3 w-3" />
                                    {folder.songs_count ?? 0} lagu ·{' '}
                                    <Badge
                                        variant={folder.is_active ? 'default' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0 h-4">
                                        {folder.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 cursor-pointer">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(folder)}>
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive cursor-pointer"
                                        onClick={() => handleDelete(folder)}>
                                        Hapus
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}

                    {folders.length === 0 && (
                        <p className="col-span-full text-center text-muted-foreground py-16">
                            Belum ada folder. Buat folder pertama!
                        </p>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Dialog ── */}
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editFolder ? 'Edit Folder' : 'Buat Folder'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        <Field label="Nama Folder" required error={errors.name}>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Fast Dynamic 1, Slow Dynamic 2..."
                            />
                        </Field>

                        {/* Color picker */}
                        <div className="flex flex-col gap-2">
                            <Label>Warna Folder</Label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData('color_code', color)}
                                        className="h-7 w-7 rounded-full ring-offset-2 transition-all cursor-pointer"
                                        style={{
                                            backgroundColor: color,
                                            outline: data.color_code === color ? `2px solid ${color}` : 'none',
                                            outlineOffset: '2px',
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-8 w-8 rounded-md border flex-shrink-0"
                                    style={{ backgroundColor: data.color_code }} />
                                <Input
                                    value={data.color_code}
                                    onChange={(e) => setData('color_code', e.target.value)}
                                    placeholder="#3B82F6"
                                    className="font-mono uppercase w-32"
                                />
                                <span className="text-xs text-muted-foreground">Hex color</span>
                            </div>
                            {errors.color_code && (
                                <p className="text-destructive text-xs">{errors.color_code}</p>
                            )}
                        </div>

                        <Field label="Deskripsi" hint="Opsional">
                            <Textarea
                                rows={2}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Opsional..."
                            />
                        </Field>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(v) => setData('is_active', v)}
                            />
                            <Label htmlFor="is_active">Folder aktif</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} className="cursor-pointer">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="cursor-pointer">
                                {processing ? 'Menyimpan...' : editFolder ? 'Simpan' : 'Buat'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus folder ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deleteTarget?.name}" akan dihapus permanen. Folder yang masih memiliki lagu tidak bisa dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-destructive hover:bg-destructive/90"
                            onClick={confirmDelete}>
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}