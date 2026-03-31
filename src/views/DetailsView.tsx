import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock3, Heart, MapPin, Share2, Users } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getClubMembers, joinClub, rsvpToEvent } from '@/src/services/firebaseService';
import { Button } from '@/src/components/Button';

interface DetailsViewProps {
  type: 'club' | 'event';
  data: any;
  user: FirebaseUser | null;
  onBack: () => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({ type, data, user, onBack }) => {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (type !== 'club' || !data.id) return;
    const unsubscribe = getClubMembers(data.id, (snapshot) => setMembers(snapshot));
    return () => unsubscribe();
  }, [data.id, type]);

  const handlePrimaryAction = async () => {
    if (!user) return;
    if (type === 'club') {
      await joinClub(data.id, user.uid);
    } else {
      await rsvpToEvent(data.id, user.uid, 'attending');
    }
  };

  return (
    <div className="screen-shell mx-auto max-w-6xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em] text-on-surface">
        <ArrowLeft size={18} /> BACK
      </button>

      <div className="grid gap-6 md:grid-cols-12">
        <section className="md:col-span-8 editorial-frame overflow-hidden bg-secondary text-white">
          <div className="relative h-[300px] border-b-[3px] border-ink md:h-[420px]">
            <img
              src={data.imageURL || data.logoURL || `https://picsum.photos/seed/${data.id}/1200/900`}
              alt={data.name || data.title}
              className="h-full w-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <span className="editorial-chip bg-tertiary-container text-on-tertiary-container">{type === 'club' ? 'CLUB DOSSIER' : 'NOW EXHIBITING'}</span>
              <h1 className="mt-4 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
                {data.name || data.title}
              </h1>
              {data.category && (
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-white/80">{data.category}</p>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <p className="max-w-3xl text-base font-medium leading-relaxed text-white/85">
              {data.description || 'An immersive commons experience built around campus energy, live crews, and editorial chaos.'}
            </p>

            {type === 'club' && (
              <div className="mt-8">
                <h3 className="font-headline text-2xl font-black uppercase tracking-tighter">THE CREW</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {members.slice(0, 8).map((member) => (
                    <div key={member.id} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-white/15">
                      <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${member.userUid}`} alt="member" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {!members.length && <p className="text-sm font-medium text-white/75">No crew members loaded yet.</p>}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="md:col-span-4">
          <div className="editorial-panel sticky top-24 bg-surface-container-lowest p-6">
            <div className="space-y-4">
              {type === 'event' ? (
                <>
                  <div className="rounded-[1.25rem] border-[3px] border-ink bg-primary-container p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Date</p>
                    <p className="mt-2 flex items-center gap-2 font-headline text-2xl font-black uppercase"><Calendar size={18} /> {data.date}</p>
                  </div>
                  <div className="rounded-[1.25rem] border-[3px] border-ink bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Time</p>
                    <p className="mt-2 flex items-center gap-2 font-headline text-2xl font-black uppercase"><Clock3 size={18} /> {data.time}</p>
                  </div>
                  <div className="rounded-[1.25rem] border-[3px] border-ink bg-secondary-container p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Location</p>
                    <p className="mt-2 flex items-center gap-2 font-headline text-2xl font-black uppercase"><MapPin size={18} /> {data.location}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-[1.25rem] border-[3px] border-ink bg-primary-container p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Members</p>
                    <p className="mt-2 flex items-center gap-2 font-headline text-2xl font-black uppercase"><Users size={18} /> {members.length}</p>
                  </div>
                  <div className="rounded-[1.25rem] border-[3px] border-ink bg-secondary-container p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Category</p>
                    <p className="mt-2 font-headline text-2xl font-black uppercase">{data.category || 'COMMUNITY'}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={handlePrimaryAction}>
                {type === 'club' ? 'JOIN THE SQUAD' : 'RESERVE ACCESS'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Heart size={16} className="mr-2" /> LIKE
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 size={16} className="mr-2" /> SHARE
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
