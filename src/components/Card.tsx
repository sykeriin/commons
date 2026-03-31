import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'low' | 'lowest' | 'primary' | 'secondary' | 'tertiary';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hoverable = true,
}) => {
  const variants = {
    default: 'bg-surface-container-lowest text-on-surface',
    low: 'bg-surface-container-low text-on-surface',
    lowest: 'bg-surface-container-lowest text-on-surface',
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] border-[3px] border-ink p-6 shadow-[6px_6px_0px_0px_var(--color-ink)] transition-all duration-200',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_35%)] before:opacity-80',
        variants[variant],
        hoverable && 'hover:-translate-y-1 hover:rotate-[0.3deg]',
        className
      )}
    >
      {children}
    </div>
  );
};
