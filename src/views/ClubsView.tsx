import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getClubs, joinClub } from '@/src/services/firebaseService';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';

export const ClubsView: React.FC<{
  user: FirebaseUser | null;
  onStartClub?: () => void;
  onManageClub?: (club: any) => void;
  onShowDetails: (type: 'club' | 'event', data: any) => void;
}> = ({ user, onStartClub, onManageClub, onShowDetails }) => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    const unsubscribe = getClubs((data) => setClubs(data));
    return () => unsubscribe();
  }, []);

  const filtered = clubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'ALL' || club.category?.toUpperCase() === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="screen-shell mx-auto max-w-6xl">
      <section className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
        <div className="editorial-panel overflow-hidden bg-primary-container p-6">
          <h2 className="font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-6xl">
            LEAD THE <br />
            <span className="text-primary italic">CHARGE</span>
          </h2>
          <p className="mt-4 max-w-sm text-base font-medium text-on-primary-container">
            Empower your squad and own the campus rhythm. Build a club profile, recruit your crew, and launch events.
          </p>
          <div className="mt-8 space-y-3">
            <Button onClick={onStartClub}>START CLUB REGISTRATION</Button>
            <Button variant="outline" onClick={() => setCategory('ALL')}>LEARN MORE</Button>
          </div>
          <div className="mt-8 rounded-[1.5rem] border-[3px] border-ink bg-tertiary-container p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">CLUBS ACTIVE</p>
            <p className="mt-1 font-headline text-4xl font-black uppercase tracking-tighter">1.2K+</p>
            <p className="text-sm font-medium text-on-surface-variant">Across all commons</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find your people"
              className="editorial-input pl-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'TECH', 'CREATIVE', 'ACADEMIC', 'ARTS', 'SPORTS'].map((option) => (
              <button
                key={option}
                onClick={() => setCategory(option)}
                className={cn(
                  'rounded-full border-[3px] border-ink px-4 py-2 font-headline text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0px_0px_var(--color-ink)]',
                  category === option ? 'bg-secondary text-on-secondary' : 'bg-white'
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((club) => (
              <div key={club.id} className="editorial-panel overflow-hidden bg-surface-container-lowest">
                <img src={club.logoURL || `https://picsum.photos/seed/${club.id}/800/800`} alt={club.name} className="h-44 w-full border-b-[3px] border-ink object-cover" referrerPolicy="no-referrer" />
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{club.category || 'CLUB'}</p>
                  <h3 className="mt-2 font-headline text-2xl font-black uppercase leading-none tracking-tighter">{club.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-on-surface-variant">{club.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-on-surface-variant">
                    <Users size={14} /> {club.memberCount || 0} members
                  </div>
                  <div className="mt-4 flex gap-2">
                    {club.ownerUid === user?.uid ? (
                      <Button size="sm" className="flex-1" onClick={() => onManageClub?.(club)}>MANAGE</Button>
                    ) : (
                      <Button size="sm" className="flex-1" onClick={async () => user && joinClub(club.id, user.uid)}>JOIN</Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onShowDetails('club', club)}>DETAILS</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
