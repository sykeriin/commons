import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Users, Zap } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getClubs, getEvents } from '@/src/services/firebaseService';
import { Button } from '@/src/components/Button';
import { CalendarWidget } from '@/src/components/CalendarWidget';

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

interface HomeViewProps {
  user: FirebaseUser | null;
  onShowDetails: (type: 'club' | 'event', data: any) => void;
  onViewSchedule: () => void;
  onTabChange: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, onShowDetails, onViewSchedule, onTabChange }) => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);

  useEffect(() => {
    const unsubClubs = getClubs((data) => setClubs(data.slice(0, 3)));
    const unsubEvents = getEvents((data) => setEvents(data.slice(0, 4)));
    return () => {
      unsubClubs();
      unsubEvents();
    };
  }, []);

  const heroEvent = events[0];
  const firstName = user?.displayName?.split(' ')[0] || 'CREW';

  useEffect(() => {
    setHeroImage(heroEvent?.imageURL || DEFAULT_HERO_IMAGE);
  }, [heroEvent]);

  return (
    <div className="screen-shell mx-auto max-w-6xl">
      <div className="grid gap-6 md:grid-cols-12">
        <section className="md:col-span-8 editorial-frame overflow-hidden bg-primary-container p-7">
          <span className="editorial-chip bg-ink text-white">SIGN UP OPEN</span>
          <div className="mt-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <h2 className="font-headline text-5xl font-black uppercase leading-[0.82] tracking-tighter text-on-surface md:text-7xl">
                {heroEvent?.name ? heroEvent.name.split(' ').slice(0, 3).join(' ') : `HEY ${firstName}`}
              </h2>
              <p className="mt-4 max-w-md text-base font-bold leading-relaxed text-on-primary-container">
                {heroEvent?.description || 'Your live campus dashboard for clubs, festivals, workshops, and every last pulse check.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => (heroEvent ? onShowDetails('event', heroEvent) : onViewSchedule())}>
                  {heroEvent ? 'REGISTER NOW' : 'VIEW SCHEDULE'}
                </Button>
                <Button variant="outline" onClick={() => onTabChange('clubs')}>
                  EXPLORE CLUBS
                </Button>
              </div>
            </div>
            <div className="relative flex justify-center">
              <img
                src={heroImage}
                alt={heroEvent?.name || 'Commons mascot'}
                className="w-full max-w-xs rounded-[1.5rem] border-[3px] border-ink object-cover shadow-[6px_6px_0px_0px_var(--color-ink)]"
                onError={() => setHeroImage(DEFAULT_HERO_IMAGE)}
                referrerPolicy="no-referrer"
              />
              <div className="absolute -left-2 top-2 h-10 w-10 rounded-full border-[3px] border-ink bg-tertiary-container" />
            </div>
          </div>
        </section>

        <section className="md:col-span-4">
          <CalendarWidget events={events} className="h-full" />
        </section>

        <section className="md:col-span-4 editorial-panel bg-surface-container-low p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-black uppercase italic tracking-tighter">CLUBS FOR YOU</h3>
            <Users size={20} />
          </div>
          <div className="space-y-3">
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => onShowDetails('club', club)}
                className="flex w-full items-center gap-3 rounded-[1.25rem] border-[2px] border-transparent bg-surface-container-lowest p-3 text-left transition-colors hover:border-ink hover:bg-secondary-container"
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[2px] border-ink bg-tertiary-container">
                  <img
                    src={club.logoURL || `https://picsum.photos/seed/${club.id}/100/100`}
                    alt={club.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-headline text-sm font-black uppercase tracking-tight">{club.name}</p>
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant">{club.category || 'COMMUNITY'}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="md:col-span-8 editorial-panel overflow-hidden bg-secondary-container">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="min-h-[250px] overflow-hidden border-b-[3px] border-ink md:border-b-0 md:border-r-[3px]">
              <img
                src={heroImage}
                alt={heroEvent?.name || 'Featured event'}
                className="h-full w-full object-cover"
                onError={() => setHeroImage(DEFAULT_HERO_IMAGE)}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6">
              <span className="editorial-chip bg-secondary text-on-secondary">TRENDING NOW</span>
              <h3 className="mt-5 font-headline text-4xl font-black uppercase leading-[0.9] tracking-tighter">
                {heroEvent?.name || 'DIGITAL ART GALLERY'}
              </h3>
              <div className="mt-6 space-y-3 text-sm font-bold text-on-secondary-container">
                <div className="flex items-center gap-2"><CalendarDays size={16} /> {heroEvent?.date || 'OCT 24-26'}</div>
                <div className="flex items-center gap-2"><MapPin size={16} /> {heroEvent?.location || 'MAIN ATRIUM'}</div>
              </div>
              <Button className="mt-7" onClick={() => heroEvent && onShowDetails('event', heroEvent)}>
                VISIT NOW
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 overflow-hidden rounded-full border-[3px] border-ink bg-ink py-3">
        <div className="ticker-content flex items-center gap-12 whitespace-nowrap">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className="flex items-center gap-3 font-headline text-sm font-black uppercase italic tracking-[0.18em] text-white">
              <Zap size={14} className="text-tertiary-container" />
              PULSE: BOT-CLASH REGISTRATION OPEN • MARKET DAY THIS FRIDAY • LIVE MAP UPDATED • NEW CLUBS TRENDING •
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
