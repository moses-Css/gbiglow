import { Printer, PrinterCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PrintStatus } from '@/types';

interface StatusBadgeProps {
    status:       PrintStatus;
    onClick?:     () => void;
    interactive?: boolean;
}

export default function StatusBadge({ status, onClick, interactive = false }: StatusBadgeProps) {
    return (
        <Badge
            variant={status === 'printed' ? 'default' : 'secondary'}
            className={interactive ? 'cursor-pointer select-none' : 'cursor-default'}
            onClick={onClick}
        >
            {status === 'printed'
                ? <><PrinterCheck className="mr-1 h-3 w-3" />Printed</>
                : <><Printer className="mr-1 h-3 w-3" />Not Printed</>
            }
        </Badge>
    );
}