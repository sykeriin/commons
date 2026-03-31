import React from 'react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-on-primary',
      secondary: 'bg-secondary text-on-secondary',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
      outline: 'bg-surface-container-lowest text-on-surface',
    };

    const sizes = {
      sm: 'min-h-10 px-4 text-[11px] font-black tracking-[0.18em]',
      md: 'min-h-12 px-6 text-sm font-black tracking-[0.16em]',
      lg: 'min-h-14 px-8 text-base font-black tracking-[0.14em]',
      xl: 'min-h-16 px-10 text-xl font-black tracking-[0.08em]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full border-[3px] border-ink font-headline uppercase transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50',
          'shadow-[4px_4px_0px_0px_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
