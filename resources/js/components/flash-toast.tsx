import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id:      string;
    type:    ToastType;
    message: string;
    exiting: boolean;
}

interface FlashContextValue {
    flash: (message: string, type?: ToastType) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const FlashContext = createContext<FlashContextValue>({ flash: () => {} });

export function useFlash() {
    return useContext(FlashContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function FlashProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const dismiss = useCallback((id: string) => {
        // Start exit animation
        setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
        // Remove after animation
        timers.current[id] = setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            delete timers.current[id];
        }, 300);
    }, []);

    const flash = useCallback((message: string, type: ToastType = 'success') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => {
            const next = [...prev, { id, type, message, exiting: false }];
            return next.slice(-5); // max 5
        });
        // Auto dismiss after 4s
        timers.current[id] = setTimeout(() => dismiss(id), 4000);
    }, [dismiss]);

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
        error:   <AlertCircle  className="h-4 w-4 text-red-500 flex-shrink-0" />,
        info:    <Info         className="h-4 w-4 text-blue-500 flex-shrink-0" />,
    };

    return (
        <FlashContext.Provider value={{ flash }}>
            {children}

            {/* Toast stack — bottom-left */}
            <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id}
                        style={{
                            animation: toast.exiting
                                ? 'toast-out 0.3s ease forwards'
                                : 'toast-in 0.3s ease forwards',
                        }}
                        className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover px-4 py-3 shadow-lg max-w-sm">
                        {icons[toast.type]}
                        <p className="text-sm leading-snug flex-1">{toast.message}</p>
                        <button onClick={() => dismiss(toast.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(-16px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes toast-out {
                    from { opacity: 1; transform: translateX(0); }
                    to   { opacity: 0; transform: translateX(-16px); }
                }
            `}</style>
        </FlashContext.Provider>
    );
}