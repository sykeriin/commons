import React from 'react';
import { motion } from 'motion/react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[#ff4a14] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center justify-between">
        <div className="pt-4 text-center">
          <h1 className="font-headline text-6xl font-black uppercase italic tracking-tighter text-white [text-shadow:4px_4px_0px_rgba(0,0,0,0.95)]">
            COMMONS
          </h1>
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-10">
          <div className="relative flex h-72 w-72 items-center justify-center">
            <div className="absolute inset-5 rotate-12 rounded-[2rem] border-[4px] border-ink/20" />
            <div className="absolute inset-0 rounded-full border-[4px] border-ink/20" />
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 3, -2, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-[4px] border-ink bg-white shadow-[10px_10px_0px_0px_var(--color-ink)]"
            >
              <img
                src="https://storage.googleapis.com/a1aa/image/3.png"
                alt="Commons mascot"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute right-0 top-3 rounded-full border-[3px] border-ink bg-tertiary-container px-4 py-2 font-headline text-xl font-black uppercase text-ink shadow-[4px_4px_0px_0px_var(--color-ink)]">
              GO!
            </div>
            <div className="absolute bottom-0 left-2 rounded-full border-[3px] border-ink bg-secondary-container px-4 py-2 font-headline text-lg font-black uppercase text-ink shadow-[4px_4px_0px_0px_var(--color-ink)]">
              RUNNING...
            </div>
          </div>

          <div className="w-full max-w-[290px]">
            <div className="h-8 overflow-hidden rounded-full border-[4px] border-ink bg-white shadow-[6px_6px_0px_0px_var(--color-ink)]">
              <motion.div
                animate={{ width: ['45%', '78%', '66%'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="h-full border-r-[4px] border-ink bg-tertiary-container"
              />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <h2 className="font-headline text-4xl font-black uppercase leading-none tracking-tighter [text-shadow:3px_3px_0px_rgba(0,0,0,0.95)]">
                CHASING THE CHAOS...
              </h2>
              <span className="rounded-xl border-[3px] border-ink bg-white px-3 py-1 font-headline text-2xl font-black text-ink shadow-[4px_4px_0px_0px_var(--color-ink)]">
                75%
              </span>
            </div>
          </div>
        </div>

        <div className="pb-2 text-center">
          <div className="mb-6 flex justify-center gap-3">
            {[0, 1, 2, 3].map((dot) => (
              <span key={dot} className={`h-3 w-3 rounded-full border border-white ${dot === 2 ? 'bg-white' : 'bg-black/80'}`} />
            ))}
          </div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-black/70">
            © 2026 SYKERIIN • ALL SYSTEMS GO
          </p>
        </div>
      </div>
    </div>
  );
};
