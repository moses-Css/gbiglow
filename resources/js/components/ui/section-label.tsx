import { cn } from '@/lib/utils';

interface SectionLabelProps {
    children:   React.ReactNode;
    className?: string;
}

export default function SectionLabel({ children, className }: SectionLabelProps) {
    return (
        <p className={cn(
            'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
            className
        )}>
            {children}
        </p>
    );
}