import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowRight, CalendarDays, Megaphone, Users } from 'lucide-react';
import { Button } from '@/src/components/Button';

const FEATURE_CARDS = [
  {
    title: 'SQUAD DISCOVERY',
    body: 'Find your people and join the most active clubs on campus.',
    icon: Users,
    tone: 'bg-surface-container-lowest rotate-[-2deg]',
    iconTone: 'bg-primary text-on-primary',
  },
  {
    title: 'LIVE EVENTS',
    body: 'Real-time updates on workshops, festivals, mixers, and campus drops.',
    icon: CalendarDays,
    tone: 'bg-secondary-container rotate-[1.5deg] md:translate-y-6',
    iconTone: 'bg-secondary text-on-secondary',
  },
  {
    title: 'CAMPUS PULSE',
    body: 'Catch official announcements, broadcasts, and urgent updates in one feed.',
    icon: Megaphone,
    tone: 'bg-tertiary-container rotate-[-1deg]',
    iconTone: 'bg-ink text-tertiary-container',
  },
];

export const LandingView: React.FC<{ onStart: () => void; onPreview?: () => void }> = ({ onStart, onPreview }) => {
  const canPreview = Boolean(onPreview);

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="fixed top-0 z-[60] w-full border-b-[3px] border-ink bg-surface-container-lowest/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="h-8 w-8 rounded-full border border-transparent" />
          <h1 className="font-headline text-2xl font-black uppercase italic tracking-tighter text-on-surface">
            <span className="text-primary">COMMONS</span>
          </h1>
          <div className="h-8 w-8 rounded-full border border-transparent" />
        </div>
      </header>

      <div className="fixed left-0 top-16 z-40 flex h-7 w-full items-center overflow-hidden border-y-[3px] border-ink bg-primary">
        <div className="ticker-content flex h-full items-center gap-10 whitespace-nowrap leading-none">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className="font-headline text-[11px] font-black uppercase tracking-[0.2em] text-on-primary">
              LIVE NOW • CAMPUS FESTIVAL RSVP • FIND YOUR COMMONS • JOIN THE MOVEMENT •
            </span>
          ))}
        </div>
      </div>

      <main className="screen-shell mx-auto max-w-6xl pt-28">
        <section className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-3xl"
          >
            <span className="editorial-chip bg-tertiary-container text-on-tertiary-container">NOW LIVE V2.0</span>
            <h2 className="mt-6 font-headline text-6xl font-black uppercase leading-[0.82] tracking-tighter text-primary md:text-8xl">
              COMMONS
            </h2>
            <p className="mt-3 font-headline text-2xl font-black italic tracking-tight text-on-surface md:text-4xl">
              YOUR CAMPUS, CENTRALIZED
            </p>
            <p className="mx-auto mt-6 max-w-xl text-base font-bold leading-relaxed text-on-surface-variant md:text-lg">
              The heart of campus life. Discover new clubs, RSVP to the latest festivals, and stay in the loop with every jam session.
            </p>

            <div className="mt-10 flex flex-col items-center gap-6">
              <Button size="xl" onClick={onStart} className="px-12">
                GET STARTED
                <ArrowRight className="ml-3" size={26} />
              </Button>
              {canPreview && (
                <Button variant="outline" size="md" onClick={onPreview}>
                  ENTER DEMO
                </Button>
              )}
              <div className="flex items-center gap-3 font-headline text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant">
                <span>SCROLL TO EXPLORE</span>
                <ArrowDown size={16} className="animate-bounce" />
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {FEATURE_CARDS.map((feature, index) => {
            const Icon = feature.icon;
            const baseRotation = index === 0 ? -2 : index === 1 ? 1.5 : -1;
            const hoverRotation = index === 0 ? -1 : index === 1 ? 2.5 : 0.5;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * (index + 1) }}
                whileHover={{ y: -8, rotate: hoverRotation }}
                className="group"
              >
                <motion.div
                  animate={{
                    y: [0, index === 1 ? -10 : -7, 0],
                    rotate: [baseRotation, baseRotation + 0.8, baseRotation],
                  }}
                  transition={{
                    duration: 4.2 + index * 0.45,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={`rounded-[1.75rem] border-[3px] border-ink p-7 shadow-[7px_7px_0px_0px_var(--color-ink)] ${feature.tone}`}
                >
                  <motion.div
                    animate={{ rotate: [0, -6, 0, 6, 0], scale: [1, 1.04, 1] }}
                    transition={{ duration: 3.2 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-ink ${feature.iconTone}`}
                  >
                    <Icon size={26} />
                  </motion.div>
                  <h3 className="font-headline text-3xl font-black uppercase tracking-tighter">{feature.title}</h3>
                  <p className="mt-3 text-base font-bold leading-snug text-on-surface-variant">{feature.body}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </section>

        <section className="mt-20 flex justify-center md:justify-end">
          <div className="relative max-w-md">
            <div className="absolute -left-6 -top-6 rounded-[1.5rem] border-[3px] border-ink bg-white p-5 shadow-[6px_6px_0px_0px_var(--color-ink)]">
              <p className="font-headline text-xl font-black uppercase leading-none tracking-tighter">
                JOIN THE <br /> COMMONS <br /> MOVEMENT
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80"
              alt="Crowd celebrating at campus event"
              className="rounded-[1.75rem] border-[3px] border-ink object-cover shadow-[7px_7px_0px_0px_var(--color-ink)]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-4 right-3 rounded-full border-[3px] border-ink bg-tertiary-container px-4 py-2 font-headline text-sm font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_var(--color-ink)]">
              BE PART OF THE VIBE
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
