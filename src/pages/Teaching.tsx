import React, { useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { attendancePct, byId, GRADE_OPTIONS, mySections, personName, placeLabel, seatsTaken, timetable } from '@/src/data/select';
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Section, Segmented, Select, Sheet, StatTile, Textarea, useAction } from '@/src/ui';
import { ClassCard } from './parts';
import { fmtDate, fmtTime, iso, addDays, DAYS, DAYS_LONG } from '@/src/lib/dates';
import { can } from '@/src/lib/permissions';
import type { AttendanceRecord } from '@/src/data/types';

const Overview: React.FC = () => {
  const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction();
  const [ohOpen, setOh] = useState(false); const [oh, setOhForm] = useState({ day: 2, start: '15:00', end: '16:00', placeId: db.places[0].id });
  if (!can(me, 'teach')) return <Navigate to="/" replace />;
  const mine = mySections(db, me);
  const students = new Set(db.enrollments.filter(e => mine.some(s => s.id === e.sectionId) && e.status === 'enrolled').map(e => e.studentId));
  const myHours = db.officeHours.filter(o => o.facultyId === me.id);
  return (
    <>
      <PageHeader title="Teaching" subtitle="Fall 2026" />
      <div className="mb-6 grid grid-cols-3 gap-3"><StatTile label="Sections" value={mine.length} /><StatTile label="Students" value={students.size} /><StatTile label="Office hours" value={myHours.length} hint="per week" /></div>
      <Section title="Your sections"><div className="grid gap-3 md:grid-cols-2">{mine.map(s => (
        <ClassCard key={s.id} s={s} to={`/teaching/${s.id}`} extra={<p className="mt-1.5"><Badge>{seatsTaken(db, s.id)}/{s.capacity} enrolled</Badge></p>} />))}
        {!mine.length && <EmptyState title="No sections assigned" />}</div></Section>
      <Section title="Office hours" action={<Button size="sm" variant="outline" onClick={() => setOh(true)}><Plus size={15} />Add slot</Button>}>
        <div className="grid gap-3 md:grid-cols-2">{myHours.map(o => (
          <Card key={o.id} className="flex items-center justify-between gap-3"><div><p className="font-bold">{DAYS_LONG[o.day]}, {fmtTime(o.start)}–{fmtTime(o.end)}</p><p className="muted !text-xs">{placeLabel(db, o.placeId)}</p></div>
            {o.booked?.length ? <Badge tone="blue">Booked by {personName(db, o.booked[0])}</Badge> : <Badge>Open</Badge>}</Card>))}</div>
      </Section>
      <Sheet open={ohOpen} onClose={() => setOh(false)} title="Add office hour"><form className="space-y-4" onSubmit={e => { e.preventDefault(); act(() => A.addOfficeHour(oh), 'Slot added').then(() => setOh(false)); }}>
        <Field label="Day"><Select value={oh.day} onChange={e => setOhForm({ ...oh, day: +e.target.value })}>{[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{DAYS_LONG[d]}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="From"><Input type="time" value={oh.start} onChange={e => setOhForm({ ...oh, start: e.target.value })} /></Field><Field label="To"><Input type="time" value={oh.end} onChange={e => setOhForm({ ...oh, end: e.target.value })} /></Field></div>
        <Field label="Where"><Select value={oh.placeId} onChange={e => setOhForm({ ...oh, placeId: e.target.value })}>{db.places.filter(p => p.kind !== 'outdoor').map(p => <option key={p.id} value={p.id}>{p.name}, {p.building}</option>)}</Select></Field>
        <Button type="submit" block>Save slot</Button></form></Sheet>
    </>
  );
};

const SectionManage: React.FC = () => {
  const { sectionId } = useParams(); const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction();
  const s = byId(db.sections, sectionId); const [tab, setTab] = useState<'roster' | 'attendance' | 'assignments' | 'news'>('roster');
  const [date, setDate] = useState(iso(new Date())); const [marks, setMarks] = useState<Record<string, AttendanceRecord['status']>>({});
  const [form, setForm] = useState<null | 'asg' | 'news'>(null); const [f, setF] = useState({ title: '', description: '', dueAt: iso(addDays(new Date(), 7)), points: 50 });
  const [gradingId, setGrading] = useState<string | null>(null);
  if (!s) return <EmptyState title="Section not found" />;
  if (s.instructorId !== me.id && me.role !== 'admin') return <EmptyState title="You can only manage your own sections" />;
  const course = byId(db.courses, s.courseId)!;
  const roster = db.enrollments.filter(e => e.sectionId === s.id && e.status === 'enrolled').map(e => ({ e, p: byId(db.people, e.studentId)! })).filter(x => x.p).sort((a, b) => a.p.name.localeCompare(b.p.name));
  const asg = db.assignments.filter(a => a.sectionId === s.id);
  const existing = (sid: string) => db.attendance.find(a => a.sectionId === s.id && a.date === date && a.studentId === sid)?.status;
  const status = (sid: string) => marks[sid] ?? existing(sid) ?? 'present';
  const ST: AttendanceRecord['status'][] = ['present', 'late', 'absent', 'excused'];
  return (
    <>
      <Link to="/teaching" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Teaching</Link>
      <PageHeader eyebrow={course.code} title={course.title} subtitle={`${roster.length} of ${s.capacity} seats · ${s.slots.map(sl => `${DAYS[sl.day]} ${fmtTime(sl.start)}`).join(', ')}`} />
      <Segmented className="mb-5" value={tab} onChange={setTab} options={[{ value: 'roster', label: 'Roster & grades' }, { value: 'attendance', label: 'Attendance' }, { value: 'assignments', label: 'Assignments' }, { value: 'news', label: 'Announce' }]} />

      {tab === 'roster' && <Card className="!p-0"><ul className="divide-y-2 divide-line">{roster.map(({ e, p }) => {
        const pct = attendancePct(db, s.id, p.id);
        return (<li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><Avatar name={p.name} size={36} />
          <div className="min-w-0 flex-1"><Link to={`/people/${p.id}`} className="font-bold hover:underline">{p.name}</Link><p className="muted !text-xs">Year {p.year} · Attendance {pct ?? '–'}{pct !== null && '%'}</p></div>
          <Select aria-label={`Final grade for ${p.name}`} className="!w-24" value={e.grade ?? ''} onChange={ev => act(() => A.setGrade(e.id, ev.target.value), 'Grade saved')}><option value="">–</option>{GRADE_OPTIONS.map(g => <option key={g}>{g}</option>)}</Select>
        </li>); })}{!roster.length && <li className="p-4"><EmptyState title="No students enrolled" /></li>}</ul></Card>}

      {tab === 'attendance' && (<>
        <div className="mb-4 flex items-end gap-3"><Field label="Class date"><Input type="date" value={date} onChange={e => { setDate(e.target.value); setMarks({}); }} /></Field>
          <Button onClick={() => act(() => A.saveAttendance(s.id, date, roster.map(r => ({ studentId: r.p.id, status: status(r.p.id) }))), 'Attendance saved')}>Save</Button>
          <Button variant="outline" onClick={() => setMarks(Object.fromEntries(roster.map(r => [r.p.id, 'present'])))}>All present</Button></div>
        <Card className="!p-0"><ul className="divide-y-2 divide-line">{roster.map(({ p }) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"><span className="font-bold">{p.name}</span>
            <div role="radiogroup" aria-label={`Attendance for ${p.name}`} className="flex gap-1">{ST.map(st => (
              <button key={st} role="radio" aria-checked={status(p.id) === st} onClick={() => setMarks({ ...marks, [p.id]: st })}
                className={`min-h-9 rounded-full border-2 px-3 text-xs font-bold capitalize ${status(p.id) === st ? 'border-on-surface bg-on-surface text-background' : 'border-line text-on-surface-variant'}`}>{st}</button>))}</div></li>))}</ul></Card></>)}

      {tab === 'assignments' && (<>
        <div className="mb-4"><Button onClick={() => setForm('asg')}><Plus size={16} />New assignment</Button></div>
        <div className="space-y-3">{asg.map(a => { const subs = db.submissions.filter(x => x.assignmentId === a.id);
          return (<Card key={a.id}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-headline font-extrabold">{a.title}</p><p className="muted !text-xs">Due {fmtDate(a.dueAt)} · {a.points} pts · {subs.length}/{roster.length} submitted</p></div>
            <Button size="sm" variant="outline" onClick={() => setGrading(gradingId === a.id ? null : a.id)}>{gradingId === a.id ? 'Close' : 'Grade'}</Button></div>
            {gradingId === a.id && <ul className="mt-3 divide-y-2 divide-line border-t-2 border-line">{roster.map(({ p }) => { const sub = subs.find(x => x.studentId === p.id);
              return (<li key={p.id} className="flex items-center justify-between gap-3 py-2"><span className="text-sm font-semibold">{p.name} {!sub && <Badge tone="warn">Not submitted</Badge>}</span>
                <Input type="number" aria-label={`Score for ${p.name}`} className="!w-24" min={0} max={a.points} defaultValue={sub?.score ?? ''} placeholder={`/${a.points}`}
                  onBlur={e => e.target.value !== '' && act(() => A.setScore(a.id, p.id, Math.min(a.points, Math.max(0, +e.target.value))), 'Saved')} /></li>); })}</ul>}
          </Card>); })}</div></>)}

      {tab === 'news' && <Card><form className="space-y-4" onSubmit={e => { e.preventDefault(); act(() => A.postAnnouncement({ title: f.title, body: f.description, scope: 'course', scopeId: s.id }), 'Posted to the class').then(() => setF({ ...f, title: '', description: '' })); }}>
        <Field label="Title"><Input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Message"><Textarea required value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field><Button type="submit">Post to class</Button></form></Card>}

      <Sheet open={form === 'asg'} onClose={() => setForm(null)} title="New assignment"><form className="space-y-4" onSubmit={e => { e.preventDefault(); act(() => A.createAssignment({ sectionId: s.id, ...f }), 'Assignment posted').then(() => setForm(null)); }}>
        <Field label="Title"><Input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Instructions"><Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Due"><Input type="date" required value={f.dueAt} onChange={e => setF({ ...f, dueAt: e.target.value })} /></Field><Field label="Points"><Input type="number" min={1} value={f.points} onChange={e => setF({ ...f, points: +e.target.value })} /></Field></div>
        <Button type="submit" block>Post assignment</Button></form></Sheet>
    </>
  );
};

export default function Teaching() {
  return <Routes><Route index element={<Overview />} /><Route path=":sectionId" element={<SectionManage />} /></Routes>;
}
export { timetable };
