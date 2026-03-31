import React from 'react';
import { ArrowLeft, Compass, Megaphone, ShieldCheck, Users } from 'lucide-react';

interface AboutCommonsViewProps {
  onBack: () => void;
}

const pillars = [
  {
    title: 'DISCOVER',
    body: 'Find the campus communities, pop-ups, workshops, and festivals that actually match your energy.',
    icon: <Compass size={20} />,
    tone: 'bg-primary-container',
  },
  {
    title: 'ORGANIZE',
    body: 'Give clubs and coordinators one shared place to publish events, manage momentum, and stay visible.',
    icon: <Megaphone size={20} />,
    tone: 'bg-secondary-container',
  },
  {
    title: 'BELONG',
    body: 'Turn fragmented campus updates into one living system that makes student life easier to enter.',
    icon: <Users size={20} />,
    tone: 'bg-tertiary-container',
  },
];

export const AboutCommonsView: React.FC<AboutCommonsViewProps> = ({ onBack }) => {
  return (
    <div className="screen-shell mx-auto max-w-5xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em] text-on-surface"
      >
        <ArrowLeft size={18} /> BACK
      </button>

      <section className="editorial-frame bg-primary-container p-6 md:p-8">
        <span className="editorial-chip bg-ink text-white">ABOUT COMMONS</span>
        <h1 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
          THE HEART OF <br />
          <span className="italic text-primary">CAMPUS LIFE</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-on-primary-container md:text-lg">
          Commons is a role-based campus experience for students, clubs, and coordinators. It brings discovery, event access,
          campus broadcasts, and community identity into one editorial, high-energy interface.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className={`editorial-panel p-5 ${pillar.tone}`}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink bg-white">
              {pillar.icon}
            </div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter">{pillar.title}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-on-surface/80">{pillar.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 editorial-panel bg-surface-container-lowest p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-tertiary-container">
            <ShieldCheck size={20} />
          </div>
          <h2 className="font-headline text-3xl font-black uppercase tracking-tighter">WHY IT EXISTS</h2>
        </div>
        <p className="max-w-3xl text-base font-medium leading-relaxed text-on-surface-variant">
          Campus tools are usually scattered across chats, forms, posters, and last-minute announcements. Commons is designed to
          make those moments feel organized, visible, and easy to act on, while still keeping the visual identity playful and alive.
        </p>
      </section>
    </div>
  );
};
