import React from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Pin, ArrowRight } from 'lucide-react';
import { useDB, useMe, useActions } from '@/src/app/session';
import { byId, mySections, timetable, visibleEvents, personName, placeLabel } from '@/src/data/select';
import { Badge, Card, EmptyState, PageHeader, Section } from '@/src/ui';
import { EventCard, ClubCard } from './parts';
import { DAYS_LONG, fmtDate, fmtTime, minutes, relDay, today, iso, addDays } from '@/src/lib/dates';
import { ROLE_LABEL } from '@/src/lib/permissions';

export const Today: React.FC = () => {
  const db = useDB(); const me = useMe()!;
  const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
  const sections = mySections(db, me);
  const todays = timetable(db, sections).filter(c => c.day === now.getDay());
  const nextClass = todays.find(c => minutes(c.end) > nowMin) ?? null;
  const upcoming = visibleEvents(db, me).filter(e => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const myRsvp = new Set(db.rsvps.filter(r => r.personId === me.id && r.status !== 'maybe').map(r => r.eventId));
  const horizon = iso(addDays(now, 7));
  const due = me.role === 'student' ? db.assignments.filter(a => sections.some(s => s.id === a.sectionId) && a.dueAt >= today() && a.dueAt <= horizon
    && !db.submissions.some(s => s.assignmentId === a.id && s.studentId === me.id)).sort((a, b) => a.dueAt.localeCompare(b.dueAt)) : [];
  const myClubs = db.memberships.filter(m => m.personId === me.id).map(m => byId(db.clubs, m.clubId)!).filter(c => c?.approval === 'approved');
  const scopes = new Set([...sections.map(s => s.id), ...myClubs.map(c => c.id), me.departmentId ?? '']);
  const news = db.announcements.filter(a => a.scope === 'campus' || scopes.has(a.scopeId ?? '')).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const hour = now.getHours(); const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const pendingWork = me.role === 'admin' || me.role === 'staff' ? db.clubs.filter(c => c.approval === 'pending').length + db.events.filter(e => e.approval === 'pending').length + (me.role === 'admin' ? db.roleRequests.filter(r => r.status === 'pending').length : 0) : 0;

  return (
    <>
      <PageHeader eyebrow={`${DAYS_LONG[now.getDay()]}, ${fmtDate(today(), { month: 'long', day: 'numeric' })}`} title={`${greet}, ${me.name.replace(/^(Dr|Prof)\.?\s+/, '').split(' ')[0]}`}
        subtitle={`${ROLE_LABEL[me.role]}${me.departmentId ? ' · ' + byId(db.departments, me.departmentId)?.name : ''}`} />

      {pendingWork > 0 && (
        <Link to="/manage" className="brut-sm mb-6 flex items-center justify-between rounded-2xl bg-tertiary-container p-4 text-on-tertiary-container">
          <span className="font-headline font-extrabold">{pendingWork} item{pendingWork > 1 ? 's' : ''} waiting for your approval</span><ArrowRight size={20} />
        </Link>)}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <Section title={sections.length ? 'Your day' : 'Classes'} action={<Link to={me.role === 'student' ? '/academics' : '/teaching'} className="text-sm font-bold text-secondary hover:underline">Timetable</Link>}>
            {todays.length === 0 ? <EmptyState title="No classes today" hint="Enjoy the free time, or find something on at the events tab." /> : (
              <ol className="space-y-3">{todays.map((c, i) => {
                const live = minutes(c.start) <= nowMin && nowMin < minutes(c.end); const done = minutes(c.end) <= nowMin;
                return (
                  <li key={i} className={`card flex gap-4 p-4 ${done ? 'opacity-55' : ''} ${live ? '!border-ink brut-sm' : ''}`}>
                    <div className="w-20 shrink-0 font-headline"><p className="text-sm font-black">{fmtTime(c.start)}</p><p className="text-xs font-semibold text-on-surface-variant">{fmtTime(c.end)}</p></div>
                    <span className="w-1 shrink-0 rounded-full" style={{ background: c.department?.color }} />
                    <div className="min-w-0 flex-1"><p className="truncate font-headline font-extrabold">{c.course.title}</p><p className="muted !text-xs">{c.course.code} · {placeLabel(db, c.placeId)}</p></div>
                    {live && <Badge tone="brand">Now</Badge>}{c === nextClass && !live && <Badge tone="lime">Next</Badge>}
                  </li>);
              })}</ol>)}
          </Section>

          {due.length > 0 && (
            <Section title="Due this week">
              <div className="space-y-2">{due.map(a => { const sec = byId(db.sections, a.sectionId)!;
                return (<Link key={a.id} to={`/academics/${sec.id}`} className="card card-hover flex items-center justify-between gap-3 p-3.5">
                  <span className="min-w-0"><span className="block truncate font-bold">{a.title}</span><span className="muted !text-xs">{sec.courseId.toUpperCase()} · {a.points} pts</span></span>
                  <Badge tone={a.dueAt <= iso(addDays(now, 2)) ? 'warn' : 'neutral'}>{relDay(a.dueAt)}</Badge></Link>); })}</div>
            </Section>)}

          <Section title="Happening soon" action={<Link to="/events" className="text-sm font-bold text-secondary hover:underline">All events</Link>}>
            <div className="space-y-3">{upcoming.slice(0, 4).map(e => (
              <div key={e.id} className="relative"><EventCard ev={e} compact />{myRsvp.has(e.id) && <span className="absolute right-3 top-3"><Badge tone="ok">You're going</Badge></span>}</div>))}
              {!upcoming.length && <EmptyState title="Nothing scheduled" />}</div>
          </Section>
        </div>

        <div>
          <Section title="Announcements">
            <div className="space-y-3">{news.map(a => (
              <Card key={a.id}>
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">{a.pinned ? <Pin size={13} className="text-primary" /> : <Megaphone size={13} />}
                  <span className="capitalize">{a.scope === 'course' ? 'Course' : a.scope}</span> · {personName(db, a.authorId)} · {relDay(a.createdAt.slice(0, 10))}</div>
                <h3 className="mt-1.5 font-headline font-extrabold">{a.title}</h3><p className="muted mt-1">{a.body}</p>
              </Card>))}</div>
          </Section>
          {myClubs.length > 0 && <Section title="Your clubs" action={<Link to="/clubs" className="text-sm font-bold text-secondary hover:underline">Browse</Link>}>
            <div className="space-y-3">{myClubs.slice(0, 3).map(c => <ClubCard key={c.id} club={c} />)}</div></Section>}
        </div>
      </div>
    </>
  );
};
