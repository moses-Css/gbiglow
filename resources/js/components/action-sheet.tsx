import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
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

    const [isExpanded, setIsExpanded] = useState(false);

    // ─── Drag intent refs ─────────────────────────────────────────────────────
    const dragModeRef = useRef<'sheet' | 'scroll' | null>(null);
    const scrollTopAtDragStart = useRef(0);
    const dragDirectionRef = useRef<'up' | 'down' | null>(null);
    const lastDragOffsetY = useRef(0);
    const maxDragOffsetRef = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);

    const INTENT_THRESHOLD = 5;    // px — minimum move before committing to a mode
    const CLOSE_THRESHOLD = 120;

    // Reset when sheet closes
    useEffect(() => {
        if (!open) {
            setIsExpanded(false);
            dragModeRef.current = null;
        }
    }, [open]);

    // ─── Drag handlers ────────────────────────────────────────────────────────

    const handleDragStart = () => {
        dragModeRef.current = null;
        dragDirectionRef.current = null;
        lastDragOffsetY.current = 0;
        scrollTopAtDragStart.current = contentRef.current?.scrollTop ?? 0;
        maxDragOffsetRef.current = 0;
    };

    const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const delta = info.offset.y - lastDragOffsetY.current;
        dragDirectionRef.current = delta > 0 ? 'down' : 'up';
        lastDragOffsetY.current = info.offset.y;
        maxDragOffsetRef.current = Math.max(maxDragOffsetRef.current, info.offset.y);

        // Commit to a mode once the gesture is intentional
        if (dragModeRef.current === null && Math.abs(info.offset.y) > INTENT_THRESHOLD) {
            const movingDown = info.offset.y > 0;
            dragModeRef.current =
                movingDown && scrollTopAtDragStart.current === 0 ? 'sheet' : 'scroll';
        }
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const mode = dragModeRef.current;
        dragModeRef.current = null;
        lastDragOffsetY.current = 0;

        const { offset, velocity } = info;
        const isFastFlick = velocity.y > 450;
        const isPastThreshold = offset.y > CLOSE_THRESHOLD;
        const endedGoingUp = velocity.y < -100;
        const userReversed = offset.y < maxDragOffsetRef.current - 30;

        // Scroll mode — close only if fast flick down while already at top
        if (mode === 'scroll') {
            if (isFastFlick && scrollTopAtDragStart.current === 0) {
                isExpanded ? setIsExpanded(false) : onClose();
            }
            return;
        }

        // User ended gesture going up → stay open, even if past threshold
        if (endedGoingUp || userReversed) return;

        if (isPastThreshold || isFastFlick) {
            isExpanded ? setIsExpanded(false) : onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
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
                        animate={{ y: 0, maxHeight: isExpanded ? '90vh' : '58vh' }}
                        exit={{ y: '100%' }}
                        layout
                        transition={{
                            y: {
                                type: 'spring',
                                damping: 30,
                                stiffness: 320,
                                mass: 0.8
                            },
                            maxHeight: {
                                type: 'tween',
                                duration: 0.22,
                                ease: 'easeOut'
                            }
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{
                            top: 0,
                            bottom: 0.85
                        }}
                        dragMomentum={false}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            'fixed bottom-0 left-0 right-0 z-50',
                            'md:hidden',
                            'bg-background frontend-theme rounded-t-4xl shadow-2xl',
                            'flex flex-col overflow-hidden'
                        )}
                        role="dialog"
                        aria-modal
                        aria-label={title}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-4 pb-8 flex-shrink-0">
                            <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header */}
                        {(title) && (
                            <div className="flex items-start justify-center px-8 pb-8 flex-shrink-0">
                                {title && (
                                    <h3 className="font-tracking-tight text-2xl text-foreground">
                                        {title}
                                    </h3>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div
                            ref={contentRef}
                            className="overflow-y-auto flex-1 px-8"
                        >
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex-shrink-0 border-t px-8 py-4 bg-background">
                                {footer}
                            </div>
                        )}

                        {/* Bottom padding for safe area */}
                        <div className="h-7 flex-shrink-0" />
                    </motion.div>

                    {/* Desktop: Center Modal */}
                    <motion.div
                        key="as-desktop"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'hidden md:flex',
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
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}