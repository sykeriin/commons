import React, { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { Check, MapPin, Clock, Plus, Users, Ticket, Trash2 } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { byId, goingCount, personName, placeLabel, visibleEvents } from '@/src/data/select';
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Section, Segmented, Select, Sheet, Textarea, useAction, hue } from '@/src/ui';
import { EventCard } from './parts';
import { fmtDate, fmtTime, relDay, today } from '@/src/lib/dates';
import { can, canEditEvent, canManageClub } from '@/src/lib/permissions';
import type { CampusEvent } from '@/src/data/types';

const List: React.FC = () => {
  const db = useDB(); const me = useMe()!;
  const [view, setView] = useState<'upcoming' | 'going' | 'past'>('upcoming'); const [cat, setCat] = useState('All'); const [q, setQ] = useState('');
  const all = visibleEvents(db, me); const cats = ['All', ...Array.from(new Set(all.map(e => e.category)))];
  const mine = new Set(db.rsvps.filter(r => r.personId === me.id && r.status !== 'maybe').map(r => r.eventId));
  const rows = useMemo(() => all.filter(e => (cat === 'All' || e.category === cat) && e.title.toLowerCase().includes(q.toLowerCase())
    && (view === 'past' ? e.date < today() : e.date >= today()) && (view !== 'going' || mine.has(e.id)))
    .sort((a, b) => (view === 'past' ? -1 : 1) * (a.date + a.start).localeCompare(b.date + b.start)), [all, cat, q, view, mine]);
  const groups = rows.reduce<Record<string, CampusEvent[]>>((g, e) => { (g[e.date] ??= []).push(e); return g; }, {});
  return (
    <>
      <PageHeader title="Events" subtitle="Find something to do" actions={<Link to="/events/new"><Button><Plus size={16} />Create event</Button></Link>} />
      <div className="mb-3 flex flex-wrap items-center gap-3"><Segmented value={view} onChange={setView} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'going', label: "I'm going" }, { value: 'past', label: 'Past' }]} />
        <Input aria-label="Search events" className="max-w-56" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="scroll-hide mb-6 flex gap-2 overflow-x-auto">{cats.map(c => <button key={c} onClick={() => setCat(c)} className={`min-h-9 shrink-0 rounded-full border-2 px-3.5 text-xs font-bold ${cat === c ? 'border-on-surface bg-on-surface text-background' : 'border-line text-on-surface-variant'}`}>{c}</button>)}</div>
      {Object.keys(groups).length === 0 ? <EmptyState title="No events here" hint="Try another filter, or create one yourself." /> :
        <div className="grid gap-x-6 xl:grid-cols-2">{Object.entries(groups).map(([d, evs]) => <Section key={d} title={relDay(d) + (relDay(d).includes(',') ? '' : ` · ${fmtDate(d)}`)}><div className="space-y-3">{evs.map(e => <EventCard key={e.id} ev={e} />)}</div></Section>)}</div>}
    </>
  );
};

const Ticket_: React.FC<{ value: string }> = ({ value }) => {
  const [svg, setSvg] = useState('');
  useEffect(() => { QRCode.toString(value, { type: 'svg', margin: 1, width: 200 }).then(setSvg).catch(() => setSvg('')); }, [value]);
  return <div role="img" aria-label="Ticket QR code" className="mx-auto w-48 rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const Detail: React.FC = () => {
  const { id } = useParams(); const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction(); const nav = useNavigate();
  const [ticket, setTicket] = useState(false);
  const ev = byId(db.events, id); if (!ev) return <EmptyState title="Event not found" />;
  const club = byId(db.clubs, ev.clubId); const org = byId(db.people, ev.organizerId);
  const rsvps = db.rsvps.filter(r => r.eventId === ev.id); const mineR = rsvps.find(r => r.personId === me.id);
  const going = rsvps.filter(r => r.status === 'going'); const wait = rsvps.filter(r => r.status === 'waitlist');
  const full = !!ev.capacity && going.length >= ev.capacity; const past = ev.date < today();
  const manager = canEditEvent(db, me, ev) || (club ? canManageClub(db, me, club) : false);
  return (
    <>
      <Link to="/events" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Events</Link>
      <div className="hue brut mb-6 rounded-3xl p-6 on-hue md:p-8" style={hue(club?.color ?? byId(db.departments, ev.departmentId)?.color)}>
        <div className="flex flex-wrap gap-2"><Badge tone="neutral" className="!bg-[var(--on-hue-soft)] !text-[var(--on-hue)]">{ev.category}</Badge>{ev.approval !== 'approved' && <Badge tone="warn">Pending approval</Badge>}{past && <Badge tone="neutral">Past</Badge>}</div>
        <h1 className="mt-3 font-headline text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">{ev.title}</h1>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold"><span className="inline-flex items-center gap-1.5"><Clock size={15} />{fmtDate(ev.date, { weekday: 'long', month: 'long', day: 'numeric' })}, {fmtTime(ev.start)}–{fmtTime(ev.end)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{placeLabel(db, ev.placeId)}</span></p>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="max-w-2xl text-base font-medium leading-relaxed">{ev.description}</p>
          <p className="muted mt-4">Organised by {club ? <Link to={`/clubs/${club.id}`} className="font-bold text-on-surface hover:underline">{club.name}</Link> : <Link to={`/people/${org?.id}`} className="font-bold text-on-surface hover:underline">{org?.name}</Link>}</p>

          {ev.approval === 'pending' && can(me, 'approve:event') && (
            <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 !border-warn"><p className="font-bold">This event is waiting for your approval.</p>
              <div className="flex gap-2"><Button size="sm" onClick={() => act(() => A.decideEvent(ev.id, 'approved'), 'Approved')}>Approve</Button><Button size="sm" variant="danger" onClick={() => act(() => A.decideEvent(ev.id, 'rejected'), 'Rejected')}>Reject</Button></div></Card>)}

          {manager && (
            <Section title={`Attendees (${going.length}${wait.length ? ` + ${wait.length} waitlisted` : ''})`} className="mt-8">
              <Card className="!p-0"><ul className="divide-y-2 divide-line">{[...going, ...wait].map(r => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5"><Avatar name={personName(db, r.personId)} size={32} /><span className="flex-1 text-sm font-bold">{personName(db, r.personId)}</span>
                  {r.status === 'waitlist' ? <Badge tone="warn">Waitlist</Badge> : <button onClick={() => act(() => A.checkIn(r.id, !r.checkedIn))} className={`min-h-9 rounded-full border-2 px-3 text-xs font-bold ${r.checkedIn ? 'border-ok bg-ok/15 text-ok' : 'border-line text-on-surface-variant'}`}>{r.checkedIn ? '✓ Checked in' : 'Check in'}</button>}</li>))}
                {!rsvps.length && <li className="muted p-4">No RSVPs yet.</li>}</ul></Card>
              <Button variant="danger" size="sm" className="mt-4" onClick={() => { if (confirm('Delete this event?')) act(() => A.deleteEvent(ev.id), 'Event deleted').then(() => nav('/events')); }}><Trash2 size={15} />Delete event</Button>
            </Section>)}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="space-y-4">
            <div className="flex items-end justify-between"><div><p className="label !mb-0">Going</p><p className="font-headline text-3xl font-black">{going.length}{ev.capacity ? <span className="text-lg text-on-surface-variant">/{ev.capacity}</span> : null}</p></div>
              {full && <Badge tone="bad">Full{wait.length ? ` · ${wait.length} waiting` : ''}</Badge>}</div>
            {ev.capacity ? <div className="h-2.5 overflow-hidden rounded-full bg-surface-container"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, going.length / ev.capacity * 100)}%` }} /></div> : null}
            {ev.approval !== 'approved' ? <p className="muted">RSVPs open once this event is approved.</p> : past ? <p className="muted">This event has ended.</p> : mineR?.status === 'going' ? (<>
              <p className="flex items-center gap-2 font-bold text-ok"><Check size={18} />You're going</p>
              <Button block variant="accent" onClick={() => setTicket(true)}><Ticket size={17} />Show ticket</Button>
              <Button block variant="outline" onClick={() => act(() => A.cancelRsvp(ev.id), 'RSVP cancelled')}>Cancel RSVP</Button></>)
              : mineR?.status === 'waitlist' ? (<><p className="font-bold text-warn">You're on the waitlist (#{wait.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex(r => r.personId === me.id) + 1})</p>
                <Button block variant="outline" onClick={() => act(() => A.cancelRsvp(ev.id), 'Left the waitlist')}>Leave waitlist</Button></>)
              : (<><Button block onClick={() => act(async () => { const r = await A.rsvp(ev.id, 'going'); return r; }, full ? 'Added to the waitlist' : "You're in!")}>{full ? 'Join waitlist' : 'RSVP: I\'m going'}</Button>
                <Button block variant="outline" onClick={() => act(() => A.rsvp(ev.id, 'maybe'), 'Marked as maybe')}>Maybe{mineR?.status === 'maybe' ? ' ✓' : ''}</Button></>)}
          </Card>
        </aside>
      </div>
      <Sheet open={ticket} onClose={() => setTicket(false)} title="Your ticket"><div className="text-center"><Ticket_ value={`commons:${ev.id}:${me.id}`} />
        <p className="mt-4 font-headline text-lg font-black">{ev.title}</p><p className="muted">{me.name} · {fmtDate(ev.date)} · {fmtTime(ev.start)}</p>
        <p className="muted mt-3 !text-xs">Show this at the door. Organisers can also check you in by name.</p></div></Sheet>
    </>
  );
};

const New: React.FC = () => {
  const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction(); const nav = useNavigate();
  const myClubs = db.clubs.filter(c => c.approval === 'approved' && canManageClub(db, me, c));
  const [f, setF] = useState({ title: '', description: '', category: 'Social', date: today(), start: '18:00', end: '20:00', placeId: db.places[0].id, scope: (myClubs.length ? 'club' : 'campus') as CampusEvent['scope'], clubId: myClubs[0]?.id ?? '', capacity: '' });
  const needsApproval = f.scope === 'campus' && me.role !== 'admin' && me.role !== 'staff';
  const canDept = me.role === 'dept_head' || me.role === 'faculty' || me.role === 'admin';
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = await act(() => A.createEvent({ title: f.title, description: f.description, category: f.category, date: f.date, start: f.start, end: f.end, placeId: f.placeId, scope: f.scope,
      clubId: f.scope === 'club' ? f.clubId : undefined, departmentId: f.scope === 'department' ? me.departmentId : undefined, capacity: f.capacity ? +f.capacity : undefined }), needsApproval ? 'Submitted for approval' : 'Event created');
    if (id) nav(`/events/${id}`);
  };
  return (
    <>
      <Link to="/events" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Events</Link>
      <PageHeader title="Create event" />
      <form onSubmit={submit} className="card max-w-2xl space-y-5 p-5 md:p-6">
        <Field label="Title"><Input required maxLength={80} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Description"><Textarea required value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hosted as"><Select value={f.scope} onChange={e => setF({ ...f, scope: e.target.value as any })}>{myClubs.length > 0 && <option value="club">A club I manage</option>}{canDept && me.departmentId && <option value="department">My department</option>}<option value="campus">Campus-wide</option></Select></Field>
          {f.scope === 'club' && <Field label="Club"><Select value={f.clubId} onChange={e => setF({ ...f, clubId: e.target.value })}>{myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>}
          <Field label="Category"><Select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{['Social', 'Tech', 'Arts', 'Sports', 'Academic', 'Career', 'Business', 'Service', 'Games'].map(c => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Date"><Input type="date" required min={today()} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Starts"><Input type="time" required value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /></Field>
          <Field label="Ends"><Input type="time" required value={f.end} onChange={e => setF({ ...f, end: e.target.value })} /></Field>
          <Field label="Venue"><Select value={f.placeId} onChange={e => setF({ ...f, placeId: e.target.value })}>{db.places.map(p => <option key={p.id} value={p.id}>{p.name}, {p.building} ({p.capacity})</option>)}</Select></Field>
          <Field label="Capacity" hint="Leave empty for unlimited."><Input type="number" min={1} value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} /></Field>
        </div>
        {needsApproval && <p className="rounded-xl bg-warn/15 p-3 text-sm font-semibold text-warn">Campus-wide events need approval from student affairs before they appear in the feed.</p>}
        <Button type="submit" size="lg">{needsApproval ? 'Submit for approval' : 'Publish event'}</Button>
      </form>
    </>
  );
};

export default function Events() {
  return <Routes><Route index element={<List />} /><Route path="new" element={<New />} /><Route path=":id" element={<Detail />} /></Routes>;
}
export { Users };
