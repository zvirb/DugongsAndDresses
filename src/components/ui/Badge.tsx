import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "npc" | "player" | "agent";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "border-transparent bg-agent-blue text-white shadow-[0_0_10px_rgba(43,43,238,0.2)]",
        secondary: "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80",
        destructive: "border-transparent bg-red-900 text-red-100 hover:bg-red-900/80",
        outline: "text-neutral-100 border-neutral-100",
        npc: "border-transparent bg-red-900/50 text-red-200 border border-red-800",
        player: "border-transparent bg-blue-900/50 text-blue-200 border border-blue-800",
        agent: "border-transparent bg-agent-blue text-white shadow-[0_0_10px_rgba(43,43,238,0.2)]",
    };

    return (
        <div ref={ref} className={cn(
            "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-agent-blue focus:ring-offset-2",
            variants[variant],
            className
        )} {...props} />
    );
});
Badge.displayName = "Badge";

export { Badge };
