import React, { useEffect, useState } from 'react';
import { Award, Edit3, Settings, Sparkles, Users } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getMemberships, getOwnedClubs, getUserData } from '@/src/services/firebaseService';
import { Button } from '@/src/components/Button';

export const ProfileView: React.FC<{
  user: FirebaseUser | null;
  onManageClub?: (club: any) => void;
  onShowDetails: (type: 'club' | 'event', data: any) => void;
  onEditProfile: () => void;
}> = ({ user, onManageClub, onShowDetails, onEditProfile }) => {
  const [userData, setUserData] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [ownedClubs, setOwnedClubs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubUser = getUserData(user.uid, (data) => setUserData(data));
    const unsubMembers = getMemberships(user.uid, (data) => setMemberships(data));
    const unsubOwned = getOwnedClubs(user.uid, (data) => setOwnedClubs(data));

    return () => {
      unsubUser();
      unsubMembers();
      unsubOwned();
    };
  }, [user]);

  const displayName = user?.displayName || 'Peter Parker';
  const spotlightClubs = [...ownedClubs, ...memberships].slice(0, 4);

  return (
    <div className="screen-shell mx-auto max-w-5xl">
      <section className="mb-10 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="h-40 w-40 overflow-hidden rounded-full border-[4px] border-ink bg-secondary-container shadow-[6px_6px_0px_0px_var(--color-ink)] md:h-48 md:w-48">
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.uid || 'commons'}`}
              alt={displayName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button
            onClick={onEditProfile}
            className="absolute bottom-1 right-1 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-tertiary-container shadow-[4px_4px_0px_0px_var(--color-ink)]"
          >
            <Sparkles size={18} />
          </button>
        </div>
        <h2 className="font-headline text-5xl font-black tracking-tighter text-on-surface md:text-7xl">{displayName}</h2>
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-primary">
          {userData?.major || 'Undeclared'} • {userData?.graduationYear || '2027'}
        </p>
        <div className="mt-5 flex gap-3">
          <Button onClick={onEditProfile}>
            <Edit3 size={16} className="mr-2" /> EDIT PROFILE
          </Button>
          <Button variant="outline">
            <Settings size={16} className="mr-2" /> SETTINGS
          </Button>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-6">
        <section className="editorial-panel bg-secondary-container p-6 md:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-black uppercase tracking-tight">MY CLUBS</h3>
            <Users size={20} />
          </div>
          <div className="space-y-3">
            {spotlightClubs.length ? (
              spotlightClubs.map((clubLike: any, index) => {
                const clubName = clubLike.name || clubLike.clubName || 'Commons Crew';
                const clubId = clubLike.id || clubLike.clubId || `club-${index}`;
                const isOwned = ownedClubs.some((owned) => owned.id === clubLike.id);

                return (
                  <div key={clubId} className="flex items-center gap-3 rounded-full border-[2px] border-ink bg-white/65 px-3 py-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-[2px] border-ink ${index % 2 ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>
                      {clubName.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-headline text-xs font-black uppercase tracking-[0.14em]">{clubName}</p>
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant">{isOwned ? 'Owner' : clubLike.role || 'Member'}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (isOwned ? onManageClub?.(clubLike) : onShowDetails('club', { id: clubId, name: clubName }))}
                    >
                      {isOwned ? 'MANAGE' : 'VIEW'}
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm font-medium text-on-surface-variant">No clubs joined yet.</p>
            )}
          </div>
        </section>

        <section className="editorial-panel bg-tertiary-container p-6 md:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-black uppercase tracking-tight">TAGS</h3>
            <Award size={20} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(userData?.selectedCommons || ['photography', 'science', 'campus-life']).map((tag: string) => (
              <span key={tag} className="rounded-full border-[2px] border-ink bg-white/60 px-4 py-1 text-xs font-black uppercase tracking-[0.14em]">
                #{tag}
              </span>
            ))}
          </div>
        </section>

        <section className="editorial-panel bg-[#fff8cd] p-6 md:col-span-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-black uppercase tracking-tight">RECENT ACTIVITY</h3>
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full border-[2px] border-ink bg-primary" />
              <span className="h-3 w-3 rounded-full border-[2px] border-ink bg-secondary" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'Attended', title: 'Salsa Night', meta: 'Central Plaza • 2h ago', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80' },
              { label: 'RSVP’d', title: 'Tech Expo', meta: 'Engineering Wing • Tomorrow', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-[1.25rem] border-[2px] border-ink bg-white/70 p-4">
                <img src={item.image} alt={item.title} className="h-20 w-24 rounded-xl border-[2px] border-ink object-cover" referrerPolicy="no-referrer" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <h4 className="font-headline text-xl font-black">{item.title}</h4>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
