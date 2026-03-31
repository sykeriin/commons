import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, Image as ImageIcon, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { createEvent, deleteEvent, getClubEvents, getClubMembers } from '@/src/services/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';

interface ClubManagementViewProps {
  club: any;
  user: FirebaseUser | null;
  onBack: () => void;
}

export const ClubManagementView: React.FC<ClubManagementViewProps> = ({ club, user, onBack }) => {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', location: '', imageURL: '' });

  useEffect(() => {
    if (!club.id) return;
    const unsubEvents = getClubEvents(club.id, (data) => setEvents(data));
    const unsubMembers = getClubMembers(club.id, (data) => setMembers(data));
    return () => {
      unsubEvents();
      unsubMembers();
    };
  }, [club.id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await createEvent({ ...eventForm, clubId: club.id, clubName: club.name, organizerUid: user.uid });
      setShowCreateEvent(false);
      setEventForm({ title: '', description: '', date: '', time: '', location: '', imageURL: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-shell mx-auto max-w-5xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em]">
        <ArrowLeft size={18} /> BACK
      </button>

      <section className="editorial-frame interactive-grid bg-secondary-container p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 overflow-hidden rounded-[1.5rem] border-[3px] border-ink bg-white shadow-[6px_6px_0px_0px_var(--color-ink)]">
              <img src={club.logoURL || `https://picsum.photos/seed/${club.id}/240/240`} alt={club.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="sticker-badge bg-ink text-white">CLUB HQ</span>
              <h1 className="mt-4 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter">{club.name}</h1>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.18em] text-on-secondary-container">
                <span>{members.length} MEMBERS</span>
                <span>{events.length} EVENTS</span>
              </div>
            </div>
          </div>
          <Button size="lg" onClick={() => setShowCreateEvent((v) => !v)}>
            <Plus size={18} className="mr-2" /> {showCreateEvent ? 'CLOSE FORM' : 'CREATE EVENT'}
          </Button>
        </div>
      </section>

      {showCreateEvent && (
        <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreateEvent} className="mt-8">
          <Card variant="primary" className="space-y-5 p-6">
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter">NEW EVENT</h2>
            <input className="editorial-input" placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2" size={18} /><input className="editorial-input pl-11" type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required /></div>
              <div className="relative"><Clock className="absolute left-4 top-1/2 -translate-y-1/2" size={18} /><input className="editorial-input pl-11" type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} required /></div>
            </div>
            <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2" size={18} /><input className="editorial-input pl-11" placeholder="Location" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} required /></div>
            <textarea className="editorial-input min-h-[120px] resize-none" placeholder="Tell everyone what is happening..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} required />
            <div className="relative"><ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2" size={18} /><input className="editorial-input pl-11" placeholder="Cover image URL" value={eventForm.imageURL} onChange={(e) => setEventForm({ ...eventForm, imageURL: e.target.value })} /></div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'PUBLISHING...' : 'PUBLISH EVENT'}</Button>
          </Card>
        </motion.form>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-headline text-3xl font-black uppercase tracking-tighter">UPCOMING EVENTS</h2>
          <div className="space-y-4">
            {events.length ? events.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card variant={i % 2 ? 'secondary' : 'tertiary'} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-headline text-2xl font-black uppercase tracking-tighter">{event.title}</h3>
                      <div className="mt-3 space-y-1 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">
                        <p>{event.date}</p>
                        <p>{event.time}</p>
                        <p>{event.location}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteEvent(event.id)} className="rounded-full border-[2px] border-ink bg-white p-2 hover:bg-primary-container">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )) : <Card className="p-6 text-center">No events yet. Create the first one.</Card>}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-headline text-3xl font-black uppercase tracking-tighter">MEMBERS</h2>
          <Card variant="lowest" className="space-y-3 p-5">
            {members.map((member, i) => (
              <div key={member.id} className={`flex items-center justify-between rounded-[1.25rem] border-[2px] border-ink p-3 ${i % 2 ? 'bg-secondary-container' : 'bg-primary-container'}`}>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full border-[2px] border-ink bg-white">
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${member.userUid}`} alt="member" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="font-headline text-sm font-black uppercase tracking-[0.14em]">USER {member.userUid.slice(0, 5)}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{member.role}</p>
                  </div>
                </div>
                <Users size={16} />
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
};
