import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Clock } from 'lucide-react';
import type { CampusEvent, Club, Person, Section } from '@/src/data/types';
import { useDB } from '@/src/app/session';
import { byId, goingCount, placeLabel, personName, sectionInfo } from '@/src/data/select';
import { Avatar, Badge, hue } from '@/src/ui';
import { fmtDate, fmtTime, relDay, DAYS } from '@/src/lib/dates';
import { ROLE_LABEL } from '@/src/lib/permissions';

export const EventCard: React.FC<{ ev: CampusEvent; compact?: boolean }> = ({ ev, compact }) => {
  const db = useDB(); const n = goingCount(db, ev.id); const full = ev.capacity ? n >= ev.capacity : false;
  const club = byId(db.clubs, ev.clubId); const color = club?.color ?? byId(db.departments, ev.departmentId)?.color ?? 'var(--primary)';
  return (
    <Link to={`/events/${ev.id}`} className="card card-hover flex gap-4 p-4">
      <div className="hue brut-sm flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl on-hue" style={hue(color)}>
        <span className="font-headline text-[10px] font-bold uppercase leading-none">{fmtDate(ev.date, { month: 'short' })}</span>
        <span className="font-headline text-2xl font-black leading-none">{ev.date.slice(8)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{ev.category}</Badge>
          {ev.approval !== 'approved' && <Badge tone="warn">Pending approval</Badge>}
          {full && <Badge tone="bad">Full</Badge>}
        </div>
        <h3 className="mt-1 truncate font-headline text-base font-extrabold">{ev.title}</h3>
        {!compact && <p className="muted mt-0.5 line-clamp-1">{ev.description}</p>}
        <p className="muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 !text-xs">
          <span className="inline-flex items-center gap-1"><Clock size={13} />{relDay(ev.date)} · {fmtTime(ev.start)}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={13} />{placeLabel(db, ev.placeId)}</span>
          <span className="inline-flex items-center gap-1"><Users size={13} />{n}{ev.capacity ? `/${ev.capacity}` : ''}</span>
        </p>
      </div>
    </Link>
  );
};

export const ClubCard: React.FC<{ club: Club }> = ({ club }) => (
  <Link to={`/clubs/${club.id}`} className="card card-hover flex items-center gap-3 p-4">
    <span className="hue brut-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-headline text-lg font-black on-hue" style={hue(club.color)}>{club.name[0]}</span>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-headline text-base font-extrabold">{club.name}</span>
      <span className="muted block !text-xs">{club.category} · {club.memberCount} members</span>
    </span>
    {club.approval !== 'approved' && <Badge tone="warn">Pending</Badge>}
  </Link>
);

export const PersonRow: React.FC<{ p: Person; sub?: React.ReactNode; right?: React.ReactNode }> = ({ p, sub, right }) => {
  const db = useDB();
  return (
    <div className="flex items-center gap-3">
      <Link to={`/people/${p.id}`}><Avatar name={p.name} size={40} /></Link>
      <div className="min-w-0 flex-1">
        <Link to={`/people/${p.id}`} className="block truncate text-sm font-bold hover:underline">{p.name}</Link>
        <p className="muted truncate !text-xs">{sub ?? `${p.title ?? ROLE_LABEL[p.role]}${p.departmentId ? ' · ' + byId(db.departments, p.departmentId)?.name : ''}`}</p>
      </div>{right}
    </div>
  );
};

export const SlotLine: React.FC<{ s: Section }> = ({ s }) => {
  const db = useDB();
  return <span>{s.slots.map(sl => `${DAYS[sl.day]} ${fmtTime(sl.start)}`).join(' · ')} · {placeLabel(db, s.slots[0].placeId)}</span>;
};

export const ClassCard: React.FC<{ s: Section; to?: string; extra?: React.ReactNode }> = ({ s, to, extra }) => {
  const db = useDB(); const { course, instructor, department } = sectionInfo(db, s);
  const body = (
    <div className="card card-hover flex gap-4 p-4">
      <span className="hue-bar w-1.5 shrink-0 rounded-full" style={hue(department?.color)} />
      <div className="min-w-0 flex-1">
        <p className="hue-text font-headline text-xs font-bold tracking-wider" style={hue(department?.color)}>{course.code} · {course.credits} cr</p>
        <h3 className="truncate font-headline text-base font-extrabold">{course.title}</h3>
        <p className="muted mt-0.5 !text-xs">{instructor?.name} · <SlotLine s={s} /></p>{extra}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};
export { personName };
export const Icon = { CalendarDays };
