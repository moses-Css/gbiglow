import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, X, Youtube } from 'lucide-react';

const PATTERNS = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function extractVideoId(url: string): string | null {
    for (const p of PATTERNS) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function looksLikeUrl(s: string): boolean {
    return s.length > 8 && (s.includes('.') || s.includes('://'));
}

interface Props {
    value:     string;
    onChange:  (v: string) => void;
    error?:    string;
    readOnly?: boolean;
}

export default function YouTubePreview({ value, onChange, error, readOnly = false }: Props) {
    const [videoId, setVideoId]           = useState<string | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [embedError, setEmbedError]     = useState(false);
    const [invalidUrl, setInvalidUrl]     = useState(false);
    const prevIdRef                       = useRef<string | null>(null);

    useEffect(() => {
        const trimmed = value.trim();

        if (!trimmed) {
            setVideoId(null);
            setIframeLoaded(false);
            setEmbedError(false);
            setInvalidUrl(false);
            prevIdRef.current = null;
            return;
        }

        const id = extractVideoId(trimmed);
        if (id) {
            if (id !== prevIdRef.current) {
                setIframeLoaded(false);
                setEmbedError(false);
                prevIdRef.current = id;
            }
            setVideoId(id);
            setInvalidUrl(false);
        } else {
            setVideoId(null);
            setInvalidUrl(looksLikeUrl(trimmed));
        }
    }, [value]);

    const hasPreview = !!videoId;
    const thumbnail  = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

    const borderClass = invalidUrl ? 'border-destructive' : 'border-border';
    const ringClass   = invalidUrl ? 'focus:ring-destructive/20' : 'focus:ring-ring';

    return (
        <div className={`rounded-xl overflow-hidden transition-all
            ${hasPreview ? 'border border-border shadow-sm' : ''}
        `}>
            {/* Input row */}
            <div className={`relative flex items-center ${hasPreview ? 'border-b border-border' : ''}`}>
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                    type="url"
                    value={value}
                    onChange={(e) => !readOnly && onChange(e.target.value)}
                    readOnly={readOnly}
                    placeholder="https://youtube.com/watch?v=..."
                    aria-label="YouTube link"
                    className={`w-full h-10 pl-9 bg-background text-sm
                        border transition-colors
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        placeholder:text-muted-foreground
                        ${invalidUrl
                            ? 'border-destructive focus:ring-destructive/25'
                            : 'border-input focus:ring-ring/30'
                        }
                        ${hasPreview ? 'rounded-t-xl rounded-b-none border-x-0 border-t-0 border-b-border' : 'rounded-xl'}
                        ${value ? 'pr-9' : 'pr-3'}
                        ${readOnly ? 'cursor-default select-all' : ''}
                    `}
                />
                {value && !readOnly && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        aria-label="Clear YouTube link"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2
                                   h-5 w-5 rounded-full flex items-center justify-center
                                   bg-muted text-muted-foreground
                                   hover:bg-muted-foreground/20 hover:text-foreground
                                   transition-colors cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {/* Status message — fixed-height slot, zero layout shift */}
            <div>
                {invalidUrl && (
                    <p className="flex items-center gap-1 text-xs text-destructive leading-none">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        Not a valid YouTube URL
                    </p>
                )}
                {error && !invalidUrl && (
                    <p className="flex items-center gap-1 text-xs text-destructive leading-none">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        {error}
                    </p>
                )}
            </div>

            {/* Embed */}
            {hasPreview && (
                <div className="relative bg-muted" style={{ paddingBottom: '56.25%' }}>
                    {!iframeLoaded && !embedError && (
                        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                            <Youtube className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                    )}
                    {embedError && (
                        <a
                            href={`https://youtube.com/watch?v=${videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                        >
                            {thumbnail && (
                                <img
                                    src={thumbnail}
                                    alt="YouTube thumbnail"
                                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-1.5 bg-black/60 px-4 py-2.5 rounded-xl backdrop-blur-sm">
                                <ExternalLink className="h-5 w-5 text-white" />
                                <p className="text-xs text-white font-medium">Video unavailable here — open on YouTube</p>
                            </div>
                        </a>
                    )}
                    {!embedError && (
                        <iframe
                            key={videoId}
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title="YouTube preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className={`absolute inset-0 w-full h-full transition-opacity duration-300
                                ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setIframeLoaded(true)}
                            onError={() => setEmbedError(true)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}