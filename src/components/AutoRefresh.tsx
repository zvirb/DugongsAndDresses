'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [router, intervalMs]);

    return null; // Invisible component
}
