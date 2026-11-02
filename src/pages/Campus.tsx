import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, Building2, UserSearch, MapPin, ArrowUpRight } from 'lucide-react';
import { useDB, useMe } from '@/src/app/session';
import { visibleEvents } from '@/src/data/select';
import { PageHeader, Section, hue } from '@/src/ui';
import { EventCard, ClubCard } from './parts';
import { today } from '@/src/lib/dates';

const TILES = [
  { to: '/events', t: 'Events', icon: CalendarDays, c: '#c2185b' },
  { to: '/clubs', t: 'Clubs', icon: Users, c: '#004be2' },
  { to: '/departments', t: 'Departments', icon: Building2, c: '#00838f' },
  { to: '/people', t: 'People', icon: UserSearch, c: '#6a4fd8' },
  { to: '/places', t: 'Places', icon: MapPin, c: '#4a5568' },
];

export default function Campus() {
  const db = useDB(); const me = useMe()!;
  const events = visibleEvents(db, me).filter(e => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const clubs = db.clubs.filter(c => c.approval === 'approved').sort((a, b) => b.memberCount - a.memberCount).slice(0, 4);
  return (
    <>
      <PageHeader title="Campus" subtitle="Everything happening around you." />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">{TILES.map(t => (
        <Link key={t.to} to={t.to} style={hue(t.c)} className="hue brut-sm group flex aspect-[4/3] flex-col justify-between rounded-2xl p-4 text-white transition-transform hover:-translate-y-0.5 md:aspect-square">
          <t.icon size={26} /><span className="flex items-center justify-between font-headline text-lg font-black">{t.t}<ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></Link>))}</div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Next up"><div className="space-y-3">{events.map(e => <EventCard key={e.id} ev={e} compact />)}</div></Section>
        <Section title="Popular clubs"><div className="space-y-3">{clubs.map(c => <ClubCard key={c.id} club={c} />)}</div></Section>
      </div>
    </>
  );
}
