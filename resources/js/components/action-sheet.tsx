import { useEffect } from 'react';
import FrontendLayout from '@/layouts/frontend-layout';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionSheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    showCloseButton?: boolean;
}

export default function ActionSheet({
    open,
    onClose,
    title,
    children,
    footer,
    showCloseButton = true,
}: ActionSheetProps) {
    // Handle ESC key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <FrontendLayout>
                    {/* Backdrop */}
                    <motion.div
                        key="as-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs"
                        onClick={onClose}
                        aria-hidden
                    />

                    {/* Mobile: Bottom Sheet */}
                    <motion.div
                        key="as-mobile"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                        }}
                        className={cn(
                            'fixed bottom-0 left-0 right-0 z-50',
                            'md:hidden', // Hide on desktop
                            'bg-background frontend-theme rounded-t-4xl shadow-2xl',
                            'max-h-[90vh] flex flex-col'
                        )}
                        role="dialog"
                        aria-modal
                        aria-label={title}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-4 pb-10 flex-shrink-0">
                            <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header */}
                        {(title) && (
                            <div className="flex items-start justify-center px-8 pb-10 flex-shrink-0">
                                {title && (
                                    <h3 className="font-tracking-tight text-2xl text-foreground">
                                        {title}
                                    </h3>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 px-8">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex-shrink-0 border-t px-8 py-4 bg-background">
                                {footer}
                            </div>
                        )}

                        {/* Bottom padding for safe area */}
                        <div className="h-6 flex-shrink-0" />
                    </motion.div>

                    {/* Desktop: Center Modal */}
                    <motion.div
                        key="as-desktop"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'hidden md:flex', // Show only on desktop
                            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                            'z-50 w-full max-w-lg',
                            'bg-background rounded-4xl shadow-2xl border',
                            'max-h-[85vh] flex-col'
                        )}
                        role="dialog"
                        aria-modal
                        aria-label={title}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-start justify-between p-6 border-b flex-shrink-0">
                                <div className="flex-1">
                                    {title && (
                                        <h3 className="font-semibold text-xl text-foreground">
                                            {title}
                                        </h3>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-4 -mt-1"
                                        aria-label="Close"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-6">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex-shrink-0 border-t p-6 bg-background">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </FrontendLayout>
            )}
        </AnimatePresence>,
        document.body
    );
}