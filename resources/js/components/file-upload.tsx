import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    value:             File | null;
    onChange:          (f: File | null) => void;
    error?:            string;
    uploadProgress?:   number;
    accept?:           string;
    maxSizeMB?:        number;
    existingFileUrl?:  string;
    existingFileName?: string;
    onRemoveExisting?: () => void;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const DEFAULT_MAX   = 10;

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
    value,
    onChange,
    error,
    uploadProgress = 0,
    accept = '.pdf,.png',
    maxSizeMB = DEFAULT_MAX,
    existingFileUrl,
    existingFileName,
    onRemoveExisting,
}: Props) {
    const inputRef                              = useRef<HTMLInputElement>(null);
    const [dragging, setDragging]               = useState(false);
    const [preview, setPreview]                 = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [removedExisting, setRemovedExisting] = useState(false);

    useEffect(() => {
        if (!value) { setPreview(null); return; }
        if (value.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(value);
        } else {
            setPreview(null);
        }
    }, [value]);

    const validate = useCallback((file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF and PNG/JPG files are allowed.';
        if (file.size > maxSizeMB * 1024 * 1024) return `File too large. Max ${maxSizeMB} MB.`;
        return null;
    }, [maxSizeMB]);

    const handleFile = useCallback((file: File) => {
        const err = validate(file);
        setValidationError(err);
        if (!err) onChange(file);
    }, [validate, onChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setValidationError(null);
        if (inputRef.current) inputRef.current.value = '';
    }, [onChange]);

    const displayError = error ?? validationError;
    const isPdf        = value?.type === 'application/pdf';
    const isUploading  = uploadProgress > 0 && uploadProgress < 100;
    const isDone       = uploadProgress >= 100;

    // ── Existing file (edit mode) — same card style as new file ──────────────
    if (!value && existingFileUrl && existingFileName && !removedExisting) {
        const existingIsPdf = existingFileName.toLowerCase().endsWith('.pdf');
        return (
            <div>
                <div className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden">
                        {existingIsPdf ? (
                            <div className="h-full w-full bg-red-500/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-red-500 tracking-wide">PDF</span>
                            </div>
                        ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{existingFileName}</p>
                        <a
                            href={existingFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            View current file
                        </a>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setRemovedExisting(true);
                            onRemoveExisting?.();
                        }}
                        className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        aria-label="Remove file"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
            </div>
        );
    }

    // ── New file selected ─────────────────────────────────────────────────────
    if (value) {
        return (
            <div className="space-y-1.5">
                <div className={`flex items-center gap-3 rounded-xl border p-3 bg-card transition-colors
                    ${displayError ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden">
                        {isPdf ? (
                            <div className="h-full w-full bg-red-500/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-red-500 tracking-wide">PDF</span>
                            </div>
                        ) : preview ? (
                            <img src={preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{value.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-muted-foreground">{formatBytes(value.size)}</p>
                            {isUploading && <p className="text-xs text-muted-foreground">· Uploading...</p>}
                            {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                            {displayError && <AlertCircle className="h-3 w-3 text-destructive" />}
                        </div>
                        {isUploading && (
                            <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isUploading}
                        className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Remove file"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {displayError && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {displayError}
                    </p>
                )}
            </div>
        );
    }

    // ── Empty: drag & drop ────────────────────────────────────────────────────
    return (
        <div className="space-y-1.5">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-150 select-none
                    ${dragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : displayError
                            ? 'border-destructive/40 bg-destructive/[0.03]'
                            : 'border-border hover:border-primary/50 hover:bg-muted/20'
                    }`}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-xl p-3 transition-colors ${dragging ? 'bg-primary/10' : 'bg-muted'}`}>
                        <UploadCloud className={`h-6 w-6 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {dragging ? 'Drop it here' : 'Choose a file or drag & drop it here'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">PDF or PNG, up to {maxSizeMB} MB</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    >
                        Browse File
                    </Button>
                </div>
            </div>
            {displayError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {displayError}
                </p>
            )}
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
        </div>
    );
}