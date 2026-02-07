'use client';

export default function ScanAnimationStyles() {
    return (
        <style jsx global>{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(400px); opacity: 0; }
                }
            `}</style>
    );
}
