import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-agent-blue/20 bg-black/40 px-3 py-1 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-agent-blue/40 focus:bg-black/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-agent-blue focus-visible:border-agent-blue focus-visible:shadow-[0_0_15px_rgba(43,43,238,0.5)] disabled:cursor-not-allowed disabled:opacity-50 text-white backdrop-blur-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
