import { createPortal } from 'react-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LucideIcon, Plus } from 'lucide-react';

interface SpeedDialAction {
    label: string;
    description?: string;
    icon: LucideIcon;
    onClick: () => void;
}

interface SpeedDialProps {
    onClick?: () => void;                // single action mode
    actions?: SpeedDialAction[];         // dropdown mode
}

export default function SpeedDial({ onClick, actions }: SpeedDialProps) {
    const trigger = (
        <button
            type="button"
            className="
                h-14 w-14 rounded-full
                bg-white/5 backdrop-blur-xl text-black dark:text-white
                border border-white/20
                shadow-md shadow-black/20
                flex items-center justify-center
                transition-transform active:scale-95
                cursor-pointer
            "
            aria-label="Add item"
            onClick={onClick}
        >
            <Plus className="h-6 w-6" />
        </button>
    );

    return createPortal(
        <div className="fixed bottom-6 right-5 z-40 md:hidden">
            {actions?.length ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-48">
                        {actions.map((action, i) => (
                            <>
                                {i > 0 && <DropdownMenuSeparator key={`sep-${i}`} />}
                                <DropdownMenuItem
                                    key={action.label}
                                    className="cursor-pointer gap-3 py-2.5"
                                    onClick={action.onClick}
                                >
                                    <action.icon className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{action.label}</p>
                                        {action.description && (
                                            <p className="text-xs text-muted-foreground">{action.description}</p>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            </>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : trigger}
        </div>,
        document.body
    );
}