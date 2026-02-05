import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const buttonVariants = ({ variant = 'primary', size = 'md', className }: { variant?: ButtonProps['variant'], size?: ButtonProps['size'], className?: string } = {}) => {
    const variants = {
      primary: 'bg-amber-600 text-black hover:bg-amber-500 font-bold',
      secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-600',
      destructive: 'bg-red-900 text-red-100 hover:bg-red-800',
      success: 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800',
      outline: 'border border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white',
      ghost: 'hover:bg-neutral-800 text-neutral-400 hover:text-white',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg',
      icon: 'h-9 w-9 p-0 flex items-center justify-center',
    };
    
    return cn(
          'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline',
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