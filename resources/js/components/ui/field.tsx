import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps {
    label:      string;
    required?:  boolean;
    children:   React.ReactNode;
    error?:     string;
    warn?:      string;
    hint?:      string;
    showError?: boolean;
    className?: string;
}

export default function Field({
    label,
    required,
    children,
    error,
    warn,
    hint,
    showError = true,
    className,
}: FieldProps) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <div className="flex items-baseline justify-between">
                <Label className="text-sm font-medium">
                    {label}
                    {required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {hint && (
                    <span className="text-xs text-muted-foreground">{hint}</span>
                )}
            </div>

            {children}

            <div className="h-4">
                {showError && error ? (
                    <p className="flex items-center gap-1 text-xs text-destructive leading-none">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        {error}
                    </p>
                ) : warn ? (
                    <p className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 leading-none">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        {warn}
                    </p>
                ) : null}
            </div>
        </div>
    );
}