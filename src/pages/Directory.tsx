import React, { useState } from 'react';
import { Link, Route, Routes, useParams, useLocation } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { byId, gpa, placeLabel } from '@/src/data/select';
import { hue, Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Section, Segmented, Select, StatTile, useAction } from '@/src/ui';
import { ClassCard, ClubCard, PersonRow } from './parts';
import { fmtTime, DAYS_LONG, relDay } from '@/src/lib/dates';
import { ROLE_LABEL } from '@/src/lib/permissions';

const Departments: React.FC = () => {
  const db = useDB();
  return (<><PageHeader title="Departments" subtitle={`${db.departments.length} departments`} />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{db.departments.map(d => { const head = byId(db.people, d.headId);
      return (<Link key={d.id} to={`/departments/${d.id}`} className="card card-hover overflow-hidden"><div className="hue-bar h-3" style={hue(d.color)} /><div className="p-5">
        <p className="hue-text font-headline text-xs font-bold tracking-widest" style={hue(d.color)}>{d.code}</p><h2 className="font-headline text-xl font-black">{d.name}</h2><p className="muted mt-1 line-clamp-2">{d.description}</p>
        <p className="muted mt-3 !text-xs">Head: <b className="text-on-surface">{head?.name ?? 'Vacant'}</b> · {db.people.filter(p => p.departmentId === d.id && p.role !== 'student').length} faculty · {db.courses.filter(c => c.departmentId === d.id).length} courses</p></div></Link>); })}</div></>);
};

const DepartmentPage: React.FC = () => {
  const { id } = useParams(); const db = useDB(); const d = byId(db.departments, id); const [tab, setTab] = useState<'faculty' | 'courses' | 'programs' | 'news'>('faculty');
  if (!d) return <EmptyState title="Department not found" />;
  const faculty = db.people.filter(p => p.departmentId === d.id && p.role !== 'student' && p.role !== 'admin'); const head = byId(db.people, d.headId);
  const students = db.people.filter(p => p.departmentId === d.id && p.role === 'student').length;
  return (<>
    <Link to="/departments" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Departments</Link>
    <div className="hue brut mb-6 rounded-3xl p-6 text-white md:p-8" style={hue(d.color)}><p className="font-headline text-sm font-bold tracking-widest opacity-90">{d.code}</p><h1 className="font-headline text-4xl font-black md:text-5xl">{d.name}</h1><p className="mt-2 max-w-xl font-semibold opacity-95">{d.description}</p>
      <p className="mt-3 flex items-center gap-1.5 text-sm font-bold"><MapPin size={15} />{d.building}</p></div>
    <div className="mb-6 grid grid-cols-3 gap-3"><StatTile label="Faculty" value={faculty.length} /><StatTile label="Students" value={students} /><StatTile label="Courses" value={db.courses.filter(c => c.departmentId === d.id).length} /></div>
    <Segmented className="mb-5" value={tab} onChange={setTab} options={[{ value: 'faculty', label: 'People' }, { value: 'courses', label: 'Courses' }, { value: 'programs', label: 'Programs' }, { value: 'news', label: 'News' }]} />
    {tab === 'faculty' && <Card className="space-y-4">{head && <PersonRow p={head} sub={`Department head · ${head.title}`} />}{faculty.filter(f => f.id !== head?.id).map(f => <PersonRow key={f.id} p={f} sub={f.title} />)}</Card>}
    {tab === 'courses' && <div className="grid gap-3 md:grid-cols-2">{db.sections.filter(s => byId(db.courses, s.courseId)?.departmentId === d.id).map(s => <ClassCard key={s.id} s={s} />)}</div>}
    {tab === 'programs' && <div className="grid gap-3 md:grid-cols-2">{db.programs.filter(p => p.departmentId === d.id).map(p => <Card key={p.id}><Badge tone="blue">{p.degree}</Badge><p className="mt-2 font-headline text-lg font-extrabold">{p.name}</p><p className="muted">{p.credits} credits</p></Card>)}</div>}
    {tab === 'news' && <div className="space-y-3">{db.announcements.filter(a => a.scope === 'department' && a.scopeId === d.id).map(a => <Card key={a.id}><p className="font-headline font-extrabold">{a.title}</p><p className="muted mt-1">{a.body}</p></Card>)}
      {!db.announcements.some(a => a.scope === 'department' && a.scopeId === d.id) && <EmptyState title="No department news" />}</div>}
  </>);
};

const People: React.FC = () => {
  const db = useDB(); const [q, setQ] = useState(''); const [role, setRole] = useState('all'); const [dept, setDept] = useState('all');
  const rows = db.people.filter(p => (role === 'all' || (role === 'faculty' ? p.role === 'faculty' || p.role === 'dept_head' : p.role === role)) && (dept === 'all' || p.departmentId === dept) && `${p.name} ${p.title ?? ''}`.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
  return (<><PageHeader title="People" subtitle="Find students, faculty and staff" />
    <div className="mb-5 flex flex-wrap gap-3"><Input aria-label="Search people" className="max-w-xs" placeholder="Search by name…" value={q} onChange={e => setQ(e.target.value)} />
      <Select aria-label="Role" className="max-w-40" value={role} onChange={e => setRole(e.target.value)}><option value="all">Everyone</option><option value="student">Students</option><option value="faculty">Faculty</option><option value="staff">Staff</option></Select>
      <Select aria-label="Department" className="max-w-52" value={dept} onChange={e => setDept(e.target.value)}><option value="all">All departments</option>{db.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
    <Card className="space-y-3.5">{rows.map(p => <PersonRow key={p.id} p={p} />)}{!rows.length && <EmptyState title="Nobody matches" />}</Card></>);
};

const Profile: React.FC = () => {
  const { id } = useParams(); const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction(); const p = byId(db.people, id);
  if (!p) return <EmptyState title="Person not found" />;
  const dept = byId(db.departments, p.departmentId); const clubs = db.memberships.filter(m => m.personId === p.id).map(m => ({ m, c: byId(db.clubs, m.clubId)! })).filter(x => x.c?.approval === 'approved');
  const hours = db.officeHours.filter(o => o.facultyId === p.id); const teaching = db.sections.filter(s => s.instructorId === p.id);
  const g = p.role === 'student' && me.id === p.id ? gpa(db, p.id) : null;
  return (<>
    <Link to="/people" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← People</Link>
    <Card className="mb-6 flex flex-wrap items-center gap-5"><Avatar name={p.name} size={84} /><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge tone={p.role === 'student' ? 'neutral' : 'blue'}>{ROLE_LABEL[p.role]}</Badge>{dept && <Badge color={dept.color}>{dept.name}</Badge>}</div>
      <h1 className="mt-2 font-headline text-3xl font-black">{p.name}</h1><p className="muted">{p.title ?? (p.year ? `Year ${p.year}` : '')}{p.office ? ` · ${p.office}` : ''}</p>{p.bio && <p className="mt-2 max-w-xl text-sm font-medium">{p.bio}</p>}</div>
      <a href={`mailto:${p.email}`}><Button variant="outline"><Mail size={16} />Email</Button></a></Card>
    {g !== null && <div className="mb-6 grid max-w-xs grid-cols-2 gap-3"><StatTile label="GPA" value={g.toFixed(2)} /><StatTile label="Karma" value={p.karma} /></div>}
    {teaching.length > 0 && <Section title="Teaching"><div className="grid gap-3 md:grid-cols-2">{teaching.map(s => <ClassCard key={s.id} s={s} />)}</div></Section>}
    {hours.length > 0 && <Section title="Office hours"><div className="grid gap-3 md:grid-cols-2">{hours.map(o => { const mine = o.booked?.includes(me.id), taken = !!o.booked?.length && !mine;
      return (<Card key={o.id} className="flex items-center justify-between gap-3"><div><p className="font-bold">{DAYS_LONG[o.day]}, {fmtTime(o.start)}–{fmtTime(o.end)}</p><p className="muted !text-xs">{placeLabel(db, o.placeId)}</p></div>
        {p.id === me.id ? <Badge>{taken || mine ? 'Booked' : 'Open'}</Badge> : mine ? <Button size="sm" variant="outline" onClick={() => act(() => A.cancelOfficeHour(o.id), 'Booking cancelled')}>Cancel</Button> : taken ? <Badge>Taken</Badge> : <Button size="sm" onClick={() => act(() => A.bookOfficeHour(o.id), 'Booked!')}>Book</Button>}</Card>); })}</div></Section>}
    {clubs.length > 0 && <Section title="Clubs"><div className="grid gap-3 md:grid-cols-2">{clubs.map(({ m, c }) => <ClubCard key={c.id} club={c} />)}</div></Section>}
  </>);
};

const Places: React.FC = () => {
  const db = useDB(); const buildings = Array.from(new Set(db.places.map(p => p.building)));
  return (<><PageHeader title="Places" subtitle="Buildings and rooms" /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{buildings.map(b => (
    <Card key={b}><h2 className="font-headline text-lg font-extrabold">{b}</h2><ul className="mt-3 space-y-2">{db.places.filter(p => p.building === b).map(p => (
      <li key={p.id} className="flex items-center justify-between gap-2 text-sm"><span className="font-semibold">{p.name}</span><span className="muted !text-xs capitalize">{p.kind} · {p.capacity}</span></li>))}</ul>
      <p className="muted mt-3 !text-xs">{db.events.filter(e => db.places.find(p => p.id === e.placeId)?.building === b && e.approval === 'approved' && e.date >= new Date().toISOString().slice(0, 10)).length} upcoming events</p></Card>))}</div></>);
};

export default function Directory() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/places')) return <Places />;
  if (pathname.startsWith('/people')) return <Routes><Route index element={<People />} /><Route path=":id" element={<Profile />} /></Routes>;
  return <Routes><Route index element={<Departments />} /><Route path=":id" element={<DepartmentPage />} /></Routes>;
}
export { relDay };
