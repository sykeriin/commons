import React, { useState } from 'react';
import { Link, Route, Routes, useParams, Navigate } from 'react-router-dom';
import { Check, Clock, Plus } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { attendancePct, byId, gpa, mySections, personName, placeLabel, seatsTaken, sectionInfo, timetable } from '@/src/data/select';
import { Badge, Button, Card, EmptyState, PageHeader, Section, Segmented, StatTile, useAction, Input, hue } from '@/src/ui';
import { ClassCard, SlotLine } from './parts';
import { DAYS, fmtDate, fmtTime, minutes, relDay } from '@/src/lib/dates';
import { cn } from '@/src/lib/utils';

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i);

const WeekGrid: React.FC<{ items: ReturnType<typeof timetable> }> = ({ items }) => {
  const db = useDB(); const today = new Date().getDay();
  return (
    <div className="card overflow-x-auto p-0">
      <div className="grid min-w-[640px] grid-cols-[3.5rem_repeat(5,1fr)]">
        <div />{[1, 2, 3, 4, 5].map(d => <div key={d} className={cn('border-b-2 border-line p-2.5 text-center font-headline text-xs font-extrabold', d === today && 'bg-primary text-on-primary')}>{DAYS[d]}</div>)}
        <div>{HOURS.map(h => <div key={h} className="h-16 pr-2 pt-1 text-right text-[11px] font-semibold text-on-surface-variant">{fmtTime(`${h}:00`).replace(':00', '')}</div>)}</div>
        {[1, 2, 3, 4, 5].map(d => (
          <div key={d} className="relative border-l-2 border-line" style={{ height: HOURS.length * 64 }}>
            {HOURS.map((h, i) => <div key={h} className="absolute inset-x-0 border-t border-line/60" style={{ top: i * 64 }} />)}
            {items.filter(c => c.day === d).map((c, i) => {
              const top = ((minutes(c.start) - 8 * 60) / 60) * 64, height = ((minutes(c.end) - minutes(c.start)) / 60) * 64 - 3;
              return (
                <Link key={i} to={`/academics/${c.section.id}`} className="hue absolute inset-x-1 overflow-hidden rounded-lg border-2 border-ink p-1.5 text-white transition-transform hover:z-10 hover:scale-[1.03]"
                  style={{ top, height, ...hue(c.department?.color) }}>
                  <p className="truncate font-headline text-xs font-black leading-tight">{c.course.code}</p><p className="truncate text-[10px] font-semibold opacity-90">{placeLabel(db, c.placeId).split(',')[0]}</p>
                </Link>);
            })}
          </div>))}
      </div>
    </div>
  );
};

const Overview: React.FC = () => {
  const db = useDB(); const me = useMe()!; const act = useAction(); const A = useActions();
  const [tab, setTab] = useState<'courses' | 'week' | 'catalog'>('courses');
  const [q, setQ] = useState(''); const [dept, setDept] = useState('all');
  if (me.role !== 'student') return <Navigate to="/teaching" replace />;
  const mine = mySections(db, me);
  const credits = mine.reduce((n, s) => n + byId(db.courses, s.courseId)!.credits, 0);
  const g = gpa(db, me.id);
  const waitlisted = db.enrollments.filter(e => e.studentId === me.id && e.status === 'waitlisted');
  const atts = mine.map(s => attendancePct(db, s.id, me.id)).filter((x): x is number => x !== null);
  const avgAtt = atts.length ? Math.round(atts.reduce((a, b) => a + b, 0) / atts.length) : null;
  const catalog = db.sections.filter(s => { const { course } = sectionInfo(db, s); return (dept === 'all' || course.departmentId === dept) && `${course.code} ${course.title}`.toLowerCase().includes(q.toLowerCase()); });
  return (
    <>
      <PageHeader title="Academics" subtitle="Fall 2026" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Courses" value={mine.length} hint={`${credits} credits`} />
        <StatTile label="GPA" value={g ? g.toFixed(2) : '–'} hint="Credit-weighted" />
        <StatTile label="Attendance" value={avgAtt !== null ? `${avgAtt}%` : '–'} tone={avgAtt !== null && avgAtt < 80 ? 'var(--bad)' : undefined} hint={avgAtt !== null && avgAtt < 80 ? 'Below 80% requirement' : 'Across your courses'} />
        <StatTile label="Waitlisted" value={waitlisted.length} />
      </div>
      <Segmented className="mb-5" value={tab} onChange={setTab} options={[{ value: 'courses', label: 'My courses' }, { value: 'week', label: 'Timetable' }, { value: 'catalog', label: 'Catalog' }]} />

      {tab === 'courses' && (mine.length ? <div className="grid gap-3 md:grid-cols-2">{mine.map(s => {
        const p = attendancePct(db, s.id, me.id);
        return <ClassCard key={s.id} s={s} to={`/academics/${s.id}`} extra={p !== null && <p className="mt-1.5"><Badge tone={p < 80 ? 'bad' : 'ok'}>Attendance {p}%</Badge></p>} />;
      })}</div> : <EmptyState title="You aren't enrolled in anything yet" action={<Button onClick={() => setTab('catalog')}>Browse the catalog</Button>} />)}

      {tab === 'week' && <WeekGrid items={timetable(db, mine)} />}

      {tab === 'catalog' && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <Input aria-label="Search courses" placeholder="Search courses…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
            <select aria-label="Department" className="field max-w-[14rem]" value={dept} onChange={e => setDept(e.target.value)}><option value="all">All departments</option>{db.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </div>
          <div className="space-y-3">{catalog.map(s => {
            const { course, instructor, department } = sectionInfo(db, s); const taken = seatsTaken(db, s.id);
            const en = db.enrollments.find(e => e.sectionId === s.id && e.studentId === me.id && e.status !== 'dropped');
            const clash = !en && timetable(db, mine).some(m => s.slots.some(sl => sl.day === m.day && minutes(sl.start) < minutes(m.end) && minutes(m.start) < minutes(sl.end)));
            return (
              <Card key={s.id} className="flex flex-wrap items-center gap-4">
                <span className="hue-bar w-1.5 self-stretch rounded-full" style={hue(department?.color)} />
                <div className="min-w-0 flex-1">
                  <p className="hue-text font-headline text-xs font-bold" style={hue(department?.color)}>{course.code} · {course.credits} credits</p>
                  <h3 className="font-headline text-base font-extrabold">{course.title}</h3>
                  <p className="muted !text-xs">{instructor?.name} · <SlotLine s={s} /></p>
                  <p className="mt-1.5 flex gap-2"><Badge tone={taken >= s.capacity ? 'bad' : 'neutral'}>{taken}/{s.capacity} seats</Badge>{clash && <Badge tone="warn">Time clash</Badge>}</p>
                </div>
                {en ? (<div className="flex items-center gap-2"><Badge tone={en.status === 'enrolled' ? 'ok' : 'warn'}>{en.status === 'enrolled' ? 'Enrolled' : 'Waitlisted'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => act(() => A.drop(s.id, me.id), 'Dropped')}>Drop</Button></div>)
                  : <Button size="sm" disabled={clash} onClick={() => act(async () => { const r = await A.enroll(s.id, me.id); return r; }, 'Done: check My courses')}><Plus size={15} />{taken >= s.capacity ? 'Join waitlist' : 'Enroll'}</Button>}
              </Card>);
          })}{!catalog.length && <EmptyState title="No courses match" />}</div>
        </>)}
    </>
  );
};

const CourseDetail: React.FC = () => {
  const { sectionId } = useParams(); const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction();
  const s = byId(db.sections, sectionId); if (!s) return <EmptyState title="Course not found" />;
  const { course, instructor, department } = sectionInfo(db, s);
  const asg = db.assignments.filter(a => a.sectionId === s.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const en = db.enrollments.find(e => e.sectionId === s.id && e.studentId === me.id);
  const att = db.attendance.filter(a => a.sectionId === s.id && a.studentId === me.id).sort((a, b) => b.date.localeCompare(a.date));
  const pct = attendancePct(db, s.id, me.id);
  const news = db.announcements.filter(a => a.scope === 'course' && a.scopeId === s.id);
  const earned = asg.reduce((n, a) => n + (db.submissions.find(x => x.assignmentId === a.id && x.studentId === me.id)?.score ?? 0), 0);
  const graded = asg.filter(a => db.submissions.find(x => x.assignmentId === a.id && x.studentId === me.id)?.score !== undefined);
  const possible = graded.reduce((n, a) => n + a.points, 0);
  return (
    <>
      <Link to="/academics" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Academics</Link>
      <PageHeader eyebrow={`${course.code} · ${department?.name}`} title={course.title} subtitle={<><Link className="font-bold hover:underline" to={`/people/${s.instructorId}`}>{instructor?.name}</Link> · <SlotLine s={s} /></>} />
      <p className="muted mb-6 max-w-2xl">{course.description}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Attendance" value={pct !== null ? `${pct}%` : '–'} tone={pct !== null && pct < 80 ? 'var(--bad)' : undefined} />
        <StatTile label="Score so far" value={possible ? `${Math.round(earned / possible * 100)}%` : '–'} hint={`${earned}/${possible} pts graded`} />
        <StatTile label="Final grade" value={en?.grade ?? '–'} /><StatTile label="Credits" value={course.credits} />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Assignments"><div className="space-y-2.5">{asg.map(a => {
          const sub = db.submissions.find(x => x.assignmentId === a.id && x.studentId === me.id); const late = !sub && a.dueAt < new Date().toISOString().slice(0, 10);
          return (
            <Card key={a.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1"><p className="font-bold">{a.title}</p><p className="muted !text-xs">Due {fmtDate(a.dueAt)} · {a.points} pts</p></div>
              {sub?.score !== undefined ? <Badge tone="ok">{sub.score}/{a.points}</Badge> : sub ? <Badge tone="blue"><Check size={12} />Submitted</Badge>
                : late ? <Badge tone="bad">Missing</Badge> : <Button size="sm" onClick={() => act(() => A.submitAssignment(a.id, me.id), 'Submitted')}>Submit</Button>}
            </Card>); })}{!asg.length && <EmptyState title="No assignments yet" />}</div></Section>
        <div>
          <Section title="Course news"><div className="space-y-3">{news.map(n => <Card key={n.id}><p className="font-headline font-extrabold">{n.title}</p><p className="muted mt-1">{n.body}</p></Card>)}{!news.length && <p className="muted">Nothing posted.</p>}</div></Section>
          <Section title="Attendance log"><Card className="!p-0"><ul className="divide-y-2 divide-line">{att.slice(0, 8).map(a => (
            <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="font-semibold">{fmtDate(a.date)}</span>
              <Badge tone={a.status === 'present' ? 'ok' : a.status === 'absent' ? 'bad' : 'warn'}><span className="capitalize">{a.status}</span></Badge></li>))}
            {!att.length && <li className="muted p-4">No records yet.</li>}</ul></Card></Section>
        </div>
      </div>
    </>
  );
};

export default function Academics() {
  return <Routes><Route index element={<Overview />} /><Route path=":sectionId" element={<CourseDetail />} /></Routes>;
}
export { Clock, relDay };
