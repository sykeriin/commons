import React from 'react';
import { ArrowLeft, EyeOff, Lock, Shield, UserCheck } from 'lucide-react';

interface PrivacyViewProps {
  onBack: () => void;
}

const privacyCards = [
  {
    title: 'ACCOUNT DATA',
    body: 'Profile info like your display name, major, and selected commons is used to personalize the campus experience.',
    icon: <UserCheck size={20} />,
    tone: 'bg-secondary-container',
  },
  {
    title: 'EVENT ACTIVITY',
    body: 'RSVPs, club joins, and engagement stats help power recommendations, role tools, and community management.',
    icon: <EyeOff size={20} />,
    tone: 'bg-tertiary-container',
  },
  {
    title: 'SECURITY',
    body: 'Authentication and access control protect your account, role-specific actions, and organization workflows.',
    icon: <Lock size={20} />,
    tone: 'bg-primary-container',
  },
];

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack }) => {
  return (
    <div className="screen-shell mx-auto max-w-5xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em] text-on-surface"
      >
        <ArrowLeft size={18} /> BACK
      </button>

      <section className="editorial-frame bg-surface-container-lowest p-6 md:p-8">
        <span className="editorial-chip bg-ink text-white">PRIVACY</span>
        <h1 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
          YOUR DATA, <br />
          <span className="italic text-primary">CAMPUS SAFE</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-on-surface-variant md:text-lg">
          Commons uses account, activity, and organization data to run discovery, event access, and role-based tools. This page
          explains that at a high level in plain language for the product preview.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {privacyCards.map((card) => (
          <div key={card.title} className={`editorial-panel p-5 ${card.tone}`}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink bg-white">
              {card.icon}
            </div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter">{card.title}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-on-surface/80">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 editorial-panel bg-surface-container-low p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-white">
            <Shield size={20} />
          </div>
          <h2 className="font-headline text-3xl font-black uppercase tracking-tighter">PRIVACY NOTES</h2>
        </div>
        <ul className="space-y-3 text-sm font-medium text-on-surface-variant">
          <li>Commons stores the minimum data needed to power profiles, club membership, and event participation.</li>
          <li>Role-based features are separated so club and coordinator actions are scoped to what those roles manage.</li>
          <li>For this preview build, this page is informational and can later be replaced with your official policy copy.</li>
        </ul>
      </section>
    </div>
  );
};
