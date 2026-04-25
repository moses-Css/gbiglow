import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
    open:     boolean;
    onClose:  () => void;
    title:    string;
    children: React.ReactNode;
    footer?:  React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="bs-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={onClose}
                        aria-hidden
                    />
                    <motion.div
                        key="bs-sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-background
                                   rounded-t-2xl border-t shadow-2xl max-h-[85vh] flex flex-col"
                        role="dialog"
                        aria-modal
                        aria-label={title}
                    >
                        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
                        </div>

                        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
                            <h3 className="font-semibold text-sm">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground
                                           hover:bg-muted transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            {children}
                        </div>

                        {footer && (
                            <div className="flex-shrink-0 border-t px-5 py-4">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}