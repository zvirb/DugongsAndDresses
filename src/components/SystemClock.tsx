'use client';

import { useEffect, useState } from 'react';

export function SystemClock() {
    const [time, setTime] = useState('');

    useEffect(() => {
        // Initial render to avoid hydration mismatch, or usesuppressHydrationWarning
        setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));

        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Prevent hydration mismatch by rendering nothing initially or a placeholder
    // But since it's just a string, empty string is fine for first render
    if (!time) return <span className="opacity-0">00:00:00</span>;

    return <>{time}</>;
}
