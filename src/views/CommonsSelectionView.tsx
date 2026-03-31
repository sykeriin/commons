import React, { useState } from 'react';
import { Lightbulb, Music2, Palette, Trophy, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/Button';

interface CommonsSelectionViewProps {
  onComplete: (selected: string[]) => void;
}

const COMMONS_OPTIONS = [
  { id: 'athletics', title: 'ATHLETICS', description: 'Game days & fitness', icon: Trophy, tone: 'bg-primary text-on-primary' },
  { id: 'vibes', title: 'VIBES', description: 'Gigs & playlists', icon: Music2, tone: 'bg-secondary-container text-on-secondary-container' },
  { id: 'innovation', title: 'INNOVATION', description: 'Workshops, labs, and big ideas', icon: Lightbulb, tone: 'bg-tertiary-container text-on-tertiary-container', full: true },
  { id: 'socials', title: 'SOCIALS', description: 'Hangouts & clubs', icon: Users, tone: 'bg-ink text-white' },
  { id: 'creative', title: 'CREATIVE', description: 'Design & performance', icon: Palette, tone: 'bg-primary-container text-on-primary-container' },
];

export const CommonsSelectionView: React.FC<CommonsSelectionViewProps> = ({ onComplete }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="screen-shell">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-7 h-48 w-48 rounded-[1.75rem] border-[3px] border-ink bg-ink shadow-[8px_8px_0px_0px_var(--color-ink)]">
            <img
              src="https://storage.googleapis.com/a1aa/image/3.png"
              alt="Commons mascot"
              className="h-full w-full rounded-[1.55rem] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="font-headline text-5xl font-black uppercase leading-[0.85] tracking-tighter text-on-surface">
            PICK YOUR <br />
            <span className="text-primary italic">COMMONS</span>
          </h1>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-on-surface-variant">
            Ignite your campus vibe. Choose your core squads to kick things off.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {COMMONS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected.includes(option.id);

            return (
              <motion.button
                key={option.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleSelection(option.id)}
                className={cn(
                  'rounded-[1.5rem] border-[3px] border-ink bg-surface-container-lowest p-4 text-left shadow-[5px_5px_0px_0px_var(--color-ink)] transition-all',
                  option.full && 'col-span-2',
                  isSelected && '-translate-y-1 bg-tertiary-container'
                )}
              >
                <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-ink', option.tone)}>
                  <Icon size={20} />
                </div>
                <h3 className="font-headline text-2xl font-black uppercase tracking-tighter">{option.title}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">{option.description}</p>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8">
          <Button size="lg" className="w-full" disabled={!selected.length} onClick={() => onComplete(selected)}>
            START DISCOVERING
            <ArrowRight className="ml-3" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
