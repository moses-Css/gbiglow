import { useEffect } from 'react';

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.documentElement.classList.add('frontend-theme');

        return () => {
            document.documentElement.classList.remove('frontend-theme');
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {children}
        </div>
    );
}