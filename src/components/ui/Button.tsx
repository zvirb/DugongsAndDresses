import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'success' | 'agent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const buttonVariants = ({ variant = 'primary', size = 'md', className }: { variant?: ButtonProps['variant'], size?: ButtonProps['size'], className?: string } = {}) => {
    const variants = {
      primary: 'bg-agent-blue text-white hover:bg-blue-600 font-bold shadow-[0_0_20px_rgba(43,43,238,0.5)] border border-agent-blue/50',
      secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600',
      destructive: 'bg-red-900 text-red-100 hover:bg-red-800 shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-800',
      success: 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-800',
      outline: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-500',
      ghost: 'hover:bg-neutral-800 text-neutral-400 hover:text-white',
      agent: 'bg-agent-blue text-white hover:bg-blue-600 font-bold shadow-[0_0_20px_rgba(43,43,238,0.5)] border border-agent-blue/50',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs uppercase tracking-wider font-bold',
      md: 'h-10 px-4 py-2 uppercase tracking-wide font-bold text-sm',
      lg: 'h-12 px-8 text-base uppercase tracking-widest font-black',
      icon: 'h-9 w-9 p-0 flex items-center justify-center',
    };
    
    return cn(
          'inline-flex items-center justify-center rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-agent-blue disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline select-none',
          variants[variant],
          sizes[size],
          className
    );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
