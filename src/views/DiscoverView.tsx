import React, { useEffect, useState } from 'react';
import { Calendar, Search, Users } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getClubs, getEvents, joinClub, rsvpToEvent } from '@/src/services/firebaseService';
import { Button } from '@/src/components/Button';
import { CalendarWidget } from '@/src/components/CalendarWidget';
import { cn } from '@/src/lib/utils';

export const DiscoverView: React.FC<{
  user: FirebaseUser | null;
  onStartClub?: () => void;
  onShowDetails: (type: 'club' | 'event', data: any) => void;
}> = ({ user, onStartClub, onShowDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'clubs' | 'events'>('all');
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const unsubClubs = getClubs((data) => setClubs(data));
    const unsubEvents = getEvents((data) => setEvents(data));
    return () => {
      unsubClubs();
      unsubEvents();
    };
  }, []);

  const items = [
    ...events.map((event) => ({
      ...event,
      itemType: 'event',
      title: event.name,
      image: event.imageURL || `https://picsum.photos/seed/${event.id}/600/600`,
      meta: event.date,
      accent: 'bg-primary-container',
    })),
    ...clubs.map((club) => ({
      ...club,
      itemType: 'club',
      title: club.name,
      image: club.logoURL || `https://picsum.photos/seed/${club.id}/600/600`,
      meta: `${club.memberCount || 0} members`,
      accent: 'bg-secondary-container',
    })),
  ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()) && (filter === 'all' || item.itemType === filter));

  const trending = items[0];

  return (
    <div className="screen-shell mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="font-headline text-5xl font-black uppercase leading-[0.85] tracking-tighter text-on-surface md:text-7xl">
          FIND YOUR <br />
          <span className="text-primary italic">VIBE</span>
        </h2>
      </div>

      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search events, workshops, clubs"
            className="editorial-input pl-11"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'events', label: 'EVENTS' },
            { id: 'clubs', label: 'CLUBS' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id as 'all' | 'clubs' | 'events')}
              className={cn(
                'rounded-full border-[3px] border-ink px-4 py-2 font-headline text-xs font-black uppercase tracking-[0.16em] shadow-[3px_3px_0px_0px_var(--color-ink)]',
                filter === option.id ? 'bg-primary text-on-primary' : 'bg-white text-on-surface'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <section className="md:col-span-5 editorial-panel bg-surface-container-lowest p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-xl font-black uppercase tracking-tighter">TRENDING NOW</h3>
            <div className="flex gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink bg-white">‹</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink bg-white">›</span>
            </div>
          </div>
          {trending ? (
            <button
              onClick={() => onShowDetails(trending.itemType as 'club' | 'event', trending)}
              className="block w-full overflow-hidden rounded-[1.5rem] border-[3px] border-ink bg-primary-container text-left shadow-[5px_5px_0px_0px_var(--color-ink)]"
            >
              <img src={trending.image} alt={trending.title} className="h-56 w-full object-cover" referrerPolicy="no-referrer" />
              <div className="p-4">
                <p className="editorial-chip bg-tertiary-container text-on-tertiary-container">FEATURED DROP</p>
                <h4 className="mt-3 font-headline text-3xl font-black uppercase leading-none tracking-tighter">{trending.title}</h4>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-on-primary-container">{trending.meta}</p>
              </div>
            </button>
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-ink bg-surface-container p-8 text-center font-bold">
              Nothing matching that search yet.
            </div>
          )}
        </section>

        <section className="md:col-span-3">
          <CalendarWidget events={events} />
        </section>

        <section className="md:col-span-4 space-y-4">
          {[
            { title: 'ART EXHIBITS', body: 'Discover the local creative underground.', tone: 'bg-surface-container-lowest' },
            { title: 'ACADEMIC WORKSHOPS', body: 'Level up your skills.', tone: 'bg-secondary-container' },
            { title: 'SPORTS TRIALS', body: 'Jump into the action.', tone: 'bg-tertiary-container' },
          ].map((category) => (
            <div key={category.title} className={`editorial-panel p-5 ${category.tone}`}>
              <h4 className="font-headline text-2xl font-black uppercase leading-none tracking-tighter">{category.title}</h4>
              <p className="mt-2 text-sm font-medium text-on-surface-variant">{category.body}</p>
            </div>
          ))}
        </section>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 9).map((item) => (
          <div key={`${item.itemType}-${item.id}`} className={`editorial-panel overflow-hidden ${item.accent}`}>
            <img src={item.image} alt={item.title} className="h-44 w-full border-b-[3px] border-ink object-cover" referrerPolicy="no-referrer" />
            <div className="p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{item.itemType}</p>
              <h4 className="mt-2 font-headline text-2xl font-black uppercase leading-none tracking-tighter">{item.title}</h4>
              <p className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-on-surface/80">
                {item.itemType === 'club' ? <Users size={14} /> : <Calendar size={14} />}
                {item.meta}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    if (!user) return;
                    if (item.itemType === 'club') {
                      await joinClub(item.id, user.uid);
                    } else {
                      await rsvpToEvent(item.id, user.uid, 'attending');
                    }
                  }}
                >
                  {item.itemType === 'club' ? 'JOIN' : 'RSVP'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onShowDetails(item.itemType as 'club' | 'event', item)}>
                  DETAILS
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!items.length && (
        <div className="mt-10 editorial-panel p-8 text-center">
          <p className="font-headline text-2xl font-black uppercase tracking-tighter">Nothing found</p>
          <p className="mt-2 text-sm font-medium text-on-surface-variant">Try a different search or kick off your own club.</p>
          <Button className="mt-6" onClick={onStartClub}>START A CLUB</Button>
        </div>
      )}
    </div>
  );
};
