'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PlayerBottomNavProps {
    id: string;
}

export default function PlayerBottomNav({ id }: PlayerBottomNavProps) {
    const pathname = usePathname();
    const isStatus = pathname === `/player/${id}`;
    const isSkills = pathname === `/player/${id}/skills`;
    const isInventory = pathname === `/player/${id}/inventory`;

    const navItems = [
        {
            href: `/player/${id}`,
            label: 'Status',
            active: isStatus,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ),
        },
        {
            href: `/player/${id}/skills`,
            label: 'Skills',
            active: isSkills,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ),
        },
        {
            href: `/player/${id}/inventory`,
            label: 'Inventory',
            active: isInventory,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            ),
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 p-4 bg-agent-navy/90 backdrop-blur-xl border-t border-white/10 z-30 flex justify-around">
            {navItems.map(item => (
                <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 group ${item.active ? 'text-agent-blue' : 'text-neutral-500'}`}>
                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl group-active:scale-95 transition-transform">
                        <div className="w-6 h-6 flex items-center justify-center">
                            {item.icon}
                        </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
