import React, { useEffect, useState } from 'react';
import { Calendar, Clock3, MapPin } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getEvents, rsvpToEvent } from '@/src/services/firebaseService';
import { Button } from '@/src/components/Button';

export const EventsView: React.FC<{
  user: FirebaseUser | null;
  onShowDetails: (type: 'club' | 'event', data: any) => void;
}> = ({ user, onShowDetails }) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = getEvents((data) => setEvents(data));
    return () => unsubscribe();
  }, []);

  const featured = events[0];

  return (
    <div className="screen-shell mx-auto max-w-6xl">
      {featured && (
        <section className="editorial-frame overflow-hidden bg-primary-container">
          <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden border-b-[3px] border-ink md:border-b-0 md:border-r-[3px]">
              <img src={featured.imageURL || `https://picsum.photos/seed/${featured.id}/1000/1000`} alt={featured.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="p-6 md:p-8">
              <span className="editorial-chip bg-tertiary-container text-on-tertiary-container">CONFIRMED ACCESS</span>
              <h2 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.82] tracking-tighter text-on-surface md:text-7xl">
                {featured.name}
              </h2>
              <p className="mt-5 max-w-lg text-base font-medium text-on-primary-container">{featured.description}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border-[3px] border-ink bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Date</p>
                  <p className="mt-2 font-headline text-xl font-black uppercase">{featured.date}</p>
                </div>
                <div className="rounded-[1.25rem] border-[3px] border-ink bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Time</p>
                  <p className="mt-2 font-headline text-xl font-black uppercase">{featured.time}</p>
                </div>
                <div className="rounded-[1.25rem] border-[3px] border-ink bg-secondary-container p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Location</p>
                  <p className="mt-2 font-headline text-xl font-black uppercase">{featured.location}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={async () => {
                    if (!user) return;
                    await rsvpToEvent(featured.id, user.uid, 'attending');
                  }}
                >
                  ADD TO CALENDAR
                </Button>
                <Button variant="outline" onClick={() => onShowDetails('event', featured)}>
                  VIEW TICKET
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.slice(1).map((event) => (
          <div key={event.id} className="editorial-panel overflow-hidden bg-surface-container-lowest">
            <img src={event.imageURL || `https://picsum.photos/seed/${event.id}/800/600`} alt={event.name} className="h-48 w-full border-b-[3px] border-ink object-cover" referrerPolicy="no-referrer" />
            <div className="p-5">
              <h3 className="font-headline text-3xl font-black uppercase leading-none tracking-tighter">{event.name}</h3>
              <div className="mt-4 space-y-2 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                <div className="flex items-center gap-2"><Calendar size={14} /> {event.date}</div>
                <div className="flex items-center gap-2"><Clock3 size={14} /> {event.time}</div>
                <div className="flex items-center gap-2"><MapPin size={14} /> {event.location}</div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => onShowDetails('event', event)}>DETAILS</Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    if (!user) return;
                    await rsvpToEvent(event.id, user.uid, 'attending');
                  }}
                >
                  RSVP
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
