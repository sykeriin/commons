import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Users, CalendarDays, ShieldCheck, Building2, ArrowRight } from 'lucide-react';
import { useSession } from '@/src/app/session';
import { PERSONAS } from '@/src/data/seed';
import { Avatar, Button } from '@/src/ui';

const FEATURES = [
  { icon: GraduationCap, t: 'Academics', d: 'Timetable, grades, attendance, assignments.' },
  { icon: Building2, t: 'Departments', d: 'Faculty, programs, courses, office hours.' },
  { icon: Users, t: 'Clubs', d: 'Join, run and approve campus clubs.' },
  { icon: CalendarDays, t: 'Events', d: 'RSVP, waitlists, QR tickets, check-in.' },
  { icon: ShieldCheck, t: 'Permissions', d: 'Student, faculty, staff, head, admin.' },
];

export const Landing: React.FC<{ onGoogle?: () => void }> = ({ onGoogle }) => {
  const { signInDemo } = useSession();
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-[calc(2.5rem+env(safe-area-inset-top))] md:pt-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <span className="brut-sm inline-flex items-center gap-2 rounded-full bg-tertiary-container px-3.5 py-1 font-headline text-xs font-extrabold uppercase tracking-widest text-on-tertiary-container">Your campus, one app</span>
        <h1 className="mt-5 font-headline text-6xl font-black leading-[0.9] tracking-tighter md:text-8xl">Com<span className="text-primary">mons</span></h1>
        <p className="mt-5 max-w-xl text-lg font-semibold text-on-surface-variant">Classes, clubs, events and people, with the right access for students, faculty, staff and administrators.</p>
      </motion.div>

      <div className="mt-8 flex flex-wrap gap-2">{FEATURES.map(f => (
        <span key={f.t} className="card flex items-center gap-2 px-3.5 py-2 text-sm font-bold"><f.icon size={16} className="text-primary" />{f.t}</span>))}
      </div>

      <section className="brut mt-10 rounded-3xl bg-surface-container-lowest p-5 md:p-7">
        <h2 className="font-headline text-2xl font-black">Try the demo</h2>
        <p className="muted mt-1">Pick who you want to be. Data is sample data stored in this browser only.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {PERSONAS.map(p => (
            <li key={p.id}>
              <button onClick={() => signInDemo(p.id)} className="card card-hover flex w-full items-center gap-3 p-3.5 text-left">
                <Avatar name={p.label} size={44} />
                <span className="min-w-0 flex-1"><span className="block font-bold">{p.label}</span><span className="muted block !text-xs">{p.blurb}</span></span>
                <ArrowRight size={18} className="text-on-surface-variant" />
              </button>
            </li>))}
        </ul>
        {onGoogle && <div className="mt-6 border-t-2 border-line pt-5"><Button variant="outline" onClick={onGoogle}>Sign in with Google</Button></div>}
      </section>
    </div>
  );
};
