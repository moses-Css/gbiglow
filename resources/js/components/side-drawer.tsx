import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SideDrawerProps {
    open:         boolean;
    onClose:      () => void;
    title:        string;
    subtitle?:    string;
    headerExtra?: React.ReactNode;
    children:     React.ReactNode;
    footer?:      React.ReactNode;
    width?:       'sm' | 'md' | 'lg';
}

const WIDTH: Record<NonNullable<SideDrawerProps['width']>, string> = {
    sm: 'md:w-[400px]',
    md: 'md:w-[480px]',
    lg: 'md:w-[560px]',
};

export default function SideDrawer({
    open, onClose, title, subtitle, headerExtra, children, footer, width = 'md',
}: SideDrawerProps) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={onClose}
                        aria-hidden
                    />
                    <motion.aside
                        key="drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
                        className={`fixed inset-0 z-50 flex flex-col bg-background
                                    md:inset-y-0 md:right-0 md:left-auto ${WIDTH[width]}
                                    border-l shadow-2xl`}
                        role="dialog"
                        aria-modal
                        aria-label={title}
                    >
                        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b flex-shrink-0">
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 flex-wrap w-full justify-between">
                                    <h2 className="text-base font-semibold truncate leading-tight">{title}</h2>
                                    {headerExtra && (
                                        <div className="flex-shrink-0">{headerExtra}</div>
                                    )}
                                </div>
                                {subtitle && (
                                    <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="flex-shrink-0 mt-0.5 p-1.5 rounded-md text-muted-foreground
                                           hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="px-6 py-5">
                                {children}
                            </div>
                        </div>

                        {footer && (
                            <div className="flex-shrink-0 border-t px-6 py-4 bg-background">
                                {footer}
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}