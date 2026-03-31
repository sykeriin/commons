import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ClipboardList, Megaphone, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/Button';

type Role = 'student' | 'club' | 'coordinator';

const ROLE_OPTIONS: Array<{
  id: Role;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  selectedTone: string;
  selectedText: string;
  description: string;
}> = [
  {
    id: 'student',
    title: 'STUDENT',
    subtitle: 'For discovering events and joining squads.',
    badge: 'TYPE 01',
    icon: BookOpen,
    accent: 'bg-primary text-on-primary',
    selectedTone: 'bg-primary-container',
    selectedText: 'text-on-primary-container',
    description: 'Find your vibe, RSVP fast, and build your campus circuit.',
  },
  {
    id: 'club',
    title: 'CLUB',
    subtitle: 'For managing members and hosting events.',
    badge: 'TYPE 02',
    icon: Megaphone,
    accent: 'bg-tertiary-container text-on-tertiary-container',
    selectedTone: 'bg-tertiary-container',
    selectedText: 'text-on-tertiary-container',
    description: 'Launch a club profile, publish events, and grow your crew.',
  },
  {
    id: 'coordinator',
    title: 'COORDINATOR',
    subtitle: 'For approving events and campus broadcasts.',
    badge: 'TYPE 03',
    icon: ClipboardList,
    accent: 'bg-secondary-container text-on-secondary-container',
    selectedTone: 'bg-secondary-container',
    selectedText: 'text-on-secondary-container',
    description: 'Run reviews, oversee the pulse, and keep the whole campus synced.',
  },
];

export const RoleSelectionView: React.FC<{ onSelect: (role: Role) => void }> = ({ onSelect }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('student');

  return (
    <div className="screen-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute left-[-3rem] top-16 text-[8rem] font-headline font-black uppercase italic tracking-tighter text-primary md:text-[12rem]">
          COMMONS
        </div>
        <div className="absolute bottom-8 right-[-1rem] text-[5rem] font-headline font-black uppercase tracking-tighter text-ink md:text-[9rem]">
          SELECT
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10">
          <span className="font-headline text-xs font-black uppercase tracking-[0.28em] text-primary">
            IDENTITY SETUP
          </span>
          <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-[0.82] tracking-tighter text-on-surface md:text-7xl">
            SELECT YOUR <br />
            <span className="text-primary italic">PATH</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {ROLE_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isActive = selectedRole === option.id;

            return (
              <motion.button
                key={option.id}
                type="button"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => setSelectedRole(option.id)}
                className={cn(
                  'group flex min-h-[320px] flex-col rounded-[2rem] border-[3px] border-ink p-6 text-left transition-all',
                  isActive && `${option.selectedTone} ${option.selectedText} -translate-y-1 shadow-[11px_11px_0px_0px_var(--color-ink)]`,
                  !isActive && 'bg-surface-container-lowest shadow-[7px_7px_0px_0px_var(--color-ink)] hover:-translate-y-1'
                )}
              >
                <div className="mb-10 flex items-start justify-between">
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-ink transition-colors',
                      isActive ? 'bg-ink text-white' : option.accent
                    )}
                  >
                    <Icon size={28} />
                  </div>
                  <span className={cn('editorial-chip transition-colors', isActive ? 'bg-white text-ink' : 'bg-ink text-white')}>
                    {option.badge}
                  </span>
                </div>

                <div className="mt-auto">
                  <h3 className="font-headline text-3xl font-black uppercase tracking-tighter md:text-4xl">
                    {option.title}
                  </h3>
                  <p className={cn('mt-3 text-sm font-bold transition-colors', isActive ? 'text-current/80' : 'text-on-surface-variant')}>
                    {option.subtitle}
                  </p>
                  <p className={cn('mt-5 max-w-xs text-sm font-medium transition-colors', isActive ? 'text-current/90' : 'text-on-surface/80')}>
                    {option.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4">
          <Button size="lg" className="w-full" onClick={() => onSelect(selectedRole)}>
            CONTINUE
            <ArrowRight className="ml-3" size={20} />
          </Button>
          <p className="text-center text-sm font-medium text-on-surface-variant">
            Not sure? <span className="font-bold text-primary">You can update this later.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
