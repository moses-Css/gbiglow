import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
    return (
        <div className={cn('rounded-md bg-muted animate-pulse', className)} />
    );
}

export default function ScheduleSkeleton() {
    return (
        <div className="flex flex-col gap-6">

            {/* Header skeleton */}
            <div className="flex flex-col gap-3">
                <Bone className="h-4 w-24" />
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                        <Bone className="h-7 w-64" />
                        <Bone className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                        <Bone className="h-8 w-24" />
                        <Bone className="h-8 w-28" />
                    </div>
                </div>
            </div>

            {/* Session block skeleton × 2 */}
            {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                        <Bone className="h-5 w-24" />
                        <Bone className="h-4 w-16" />
                    </div>
                    <Bone className="h-9 w-full" />
                    {[0, 1, 2].map((j) => (
                        <div key={j} className="flex items-center gap-3 rounded-xl border px-3 py-3">
                            <Bone className="h-11 w-7 rounded-lg" />
                            <Bone className="h-4 w-4 rounded-full" />
                            <div className="flex-1 flex flex-col gap-2">
                                <Bone className="h-4 w-40" />
                                <Bone className="h-3 w-24" />
                            </div>
                            <Bone className="h-8 w-8 rounded-lg" />
                            <Bone className="h-11 w-11 rounded-lg" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}