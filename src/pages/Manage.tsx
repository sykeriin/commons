import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { byId, goingCount, personName, seatsTaken } from '@/src/data/select';
import { Avatar, Badge, BarList, Button, Card, EmptyState, Field, Input, PageHeader, Section, Segmented, Select, StatTile, Textarea, useAction } from '@/src/ui';
import { can, ROLE_LABEL } from '@/src/lib/permissions';
import { fmtDate, relDay } from '@/src/lib/dates';
import type { Role } from '@/src/data/types';

type Tab = 'overview' | 'approvals' | 'roles' | 'users' | 'courses' | 'announce' | 'audit';

export default function Manage() {
  const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction();
  const tabs: { value: Tab; label: string }[] = [{ value: 'overview', label: 'Overview' }];
  if (can(me, 'approve:club')) tabs.push({ value: 'approvals', label: 'Approvals' });
  if (can(me, 'manage:roles')) tabs.push({ value: 'roles', label: 'Role requests' }, { value: 'users', label: 'Users' });
  if (can(me, 'manage:courses')) tabs.push({ value: 'courses', label: 'Courses' });
  tabs.push({ value: 'announce', label: 'Announce' });
  if (can(me, 'audit:view')) tabs.push({ value: 'audit', label: 'Audit log' });
  const [tab, setTab] = useState<Tab>('overview');
  const [q, setQ] = useState(''); const [post, setPost] = useState({ title: '', body: '', pinned: false });
  const [c, setC] = useState({ code: '', title: '', credits: 3, departmentId: me.departmentId ?? db.departments[0]?.id, instructorId: '', capacity: 30 });
  if (!can(me, 'manage:console')) return <Navigate to="/" replace />;

  const pendingClubs = db.clubs.filter(x => x.approval === 'pending'); const pendingEvents = db.events.filter(e => e.approval === 'pending'); const pendingRoles = db.roleRequests.filter(r => r.status === 'pending');
  const scopeDept = me.role === 'dept_head' ? me.departmentId : undefined;
  const depts = db.departments.filter(d => !scopeDept || d.id === scopeDept);
  const stats = depts.map(d => ({ label: d.name, value: db.people.filter(p => p.role === 'student' && p.departmentId === d.id).length, color: d.color }));
  const enrol = depts.map(d => ({ label: d.name, value: db.enrollments.filter(e => e.status === 'enrolled' && byId(db.courses, byId(db.sections, e.sectionId)?.courseId)?.departmentId === d.id).length, color: d.color }));
  const evAtt = db.events.filter(e => e.approval === 'approved' && db.rsvps.some(r => r.eventId === e.id)).sort((a, b) => goingCount(db, b.id) - goingCount(db, a.id)).slice(0, 6).map(e => ({ label: e.title, value: goingCount(db, e.id) }));
  const users = db.people.filter(p => `${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  const teachers = db.people.filter(p => (p.role === 'faculty' || p.role === 'dept_head') && (!scopeDept || p.departmentId === scopeDept));
  const courses = db.courses.filter(x => !scopeDept || x.departmentId === scopeDept);

  return (
    <>
      <PageHeader eyebrow={ROLE_LABEL[me.role]} title="Manage" subtitle={scopeDept ? byId(db.departments, scopeDept)?.name : 'Campus administration'} />
      <Segmented className="mb-6" value={tab} onChange={setTab} options={tabs.map(t => ({ value: t.value, label: t.value === 'approvals' && pendingClubs.length + pendingEvents.length ? `${t.label} (${pendingClubs.length + pendingEvents.length})` : t.value === 'roles' && pendingRoles.length ? `${t.label} (${pendingRoles.length})` : t.label }))} />

      {tab === 'overview' && (<>
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4"><StatTile label="Students" value={db.people.filter(p => p.role === 'student' && (!scopeDept || p.departmentId === scopeDept)).length} /><StatTile label="Faculty" value={teachers.length} />
          <StatTile label="Active clubs" value={db.clubs.filter(x => x.approval === 'approved').length} /><StatTile label="Upcoming events" value={db.events.filter(e => e.approval === 'approved' && e.date >= new Date().toISOString().slice(0, 10)).length} /></div>
        <div className="grid gap-6 lg:grid-cols-2"><Card><h3 className="h-sec mb-4">Students per department</h3><BarList items={stats} /></Card><Card><h3 className="h-sec mb-4">Course enrolments</h3><BarList items={enrol} /></Card>
          <Card className="lg:col-span-2"><h3 className="h-sec mb-4">Most popular events (RSVPs)</h3><BarList items={evAtt} /></Card></div></>)}

      {tab === 'approvals' && (<div className="grid gap-8 lg:grid-cols-2">
        <Section title={`Clubs (${pendingClubs.length})`}><div className="space-y-3">{pendingClubs.map(x => (<Card key={x.id}><Link to={`/clubs/${x.id}`} className="font-headline text-lg font-extrabold hover:underline">{x.name}</Link><p className="muted">{x.description}</p>
          <p className="muted mt-1 !text-xs">President {personName(db, x.presidentId)} · {x.advisorId ? `Advisor ${personName(db, x.advisorId)}` : 'No advisor'}</p>
          <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => act(() => A.decideClub(x.id, 'approved'), 'Approved')}><Check size={15} />Approve</Button><Button size="sm" variant="danger" onClick={() => act(() => A.decideClub(x.id, 'rejected'), 'Rejected')}><X size={15} />Reject</Button></div></Card>))}{!pendingClubs.length && <EmptyState title="No clubs waiting" />}</div></Section>
        <Section title={`Events (${pendingEvents.length})`}><div className="space-y-3">{pendingEvents.map(e => (<Card key={e.id}><Link to={`/events/${e.id}`} className="font-headline text-lg font-extrabold hover:underline">{e.title}</Link><p className="muted">{fmtDate(e.date)} · by {personName(db, e.organizerId)}</p>
          <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => act(() => A.decideEvent(e.id, 'approved'), 'Approved')}><Check size={15} />Approve</Button><Button size="sm" variant="danger" onClick={() => act(() => A.decideEvent(e.id, 'rejected'), 'Rejected')}><X size={15} />Reject</Button></div></Card>))}{!pendingEvents.length && <EmptyState title="No events waiting" />}</div></Section></div>)}

      {tab === 'roles' && <div className="space-y-3">{db.roleRequests.map(r => (<Card key={r.id} className="flex flex-wrap items-center gap-4"><Avatar name={personName(db, r.personId)} /><div className="min-w-0 flex-1"><p className="font-bold">{personName(db, r.personId)} → {ROLE_LABEL[r.requested]}</p><p className="muted">{r.reason}</p><p className="muted !text-xs">{relDay(r.createdAt.slice(0, 10))}</p></div>
        {r.status === 'pending' ? <div className="flex gap-2"><Button size="sm" onClick={() => act(() => A.decideRole(r.id, 'approved'), 'Role granted')}>Approve</Button><Button size="sm" variant="danger" onClick={() => act(() => A.decideRole(r.id, 'rejected'), 'Rejected')}>Reject</Button></div> : <Badge tone={r.status === 'approved' ? 'ok' : 'bad'}>{r.status}</Badge>}</Card>))}{!db.roleRequests.length && <EmptyState title="No role requests" />}</div>}

      {tab === 'users' && (<><Input aria-label="Search users" className="mb-4 max-w-sm" placeholder="Search name or email…" value={q} onChange={e => setQ(e.target.value)} />
        <Card className="overflow-x-auto !p-0"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b-2 border-line text-xs uppercase tracking-wider text-on-surface-variant"><th className="p-3">Person</th><th className="p-3">Role</th><th className="p-3">Department</th></tr></thead><tbody>
          {users.map(p => (<tr key={p.id} className="border-b border-line last:border-0"><td className="p-3"><span className="flex items-center gap-3"><Avatar name={p.name} size={32} /><span><b className="block">{p.name}</b><span className="muted !text-xs">{p.email}</span></span></span></td>
            <td className="p-3"><Select aria-label={`Role for ${p.name}`} className="!w-40" value={p.role} onChange={e => act(() => A.setPersonRole(p.id, e.target.value as Role), 'Role updated')}>{(['student', 'faculty', 'staff', 'dept_head', 'admin'] as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></td>
            <td className="p-3"><Select aria-label={`Department for ${p.name}`} className="!w-48" value={p.departmentId ?? ''} onChange={e => act(() => A.setPersonDepartment(p.id, e.target.value), 'Department updated')}><option value="">None</option>{db.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></td></tr>))}</tbody></table></Card></>)}

      {tab === 'courses' && (<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Section title="Add a course"><Card><form className="space-y-4" onSubmit={e => { e.preventDefault(); act(() => A.createCourse({ code: c.code.toUpperCase(), title: c.title, credits: c.credits, departmentId: c.departmentId!, description: `${c.title}.`, section: c.instructorId ? { instructorId: c.instructorId, capacity: c.capacity, slots: [{ day: 1, start: '09:00', end: '10:15', placeId: db.places[0].id }, { day: 3, start: '09:00', end: '10:15', placeId: db.places[0].id }] } : undefined }), 'Course added').then(() => setC({ ...c, code: '', title: '' })); }}>
          <div className="grid grid-cols-2 gap-3"><Field label="Code"><Input required placeholder="CS450" value={c.code} onChange={e => setC({ ...c, code: e.target.value })} /></Field><Field label="Credits"><Input type="number" min={1} max={6} value={c.credits} onChange={e => setC({ ...c, credits: +e.target.value })} /></Field></div>
          <Field label="Title"><Input required value={c.title} onChange={e => setC({ ...c, title: e.target.value })} /></Field>
          <Field label="Department"><Select disabled={!!scopeDept} value={c.departmentId} onChange={e => setC({ ...c, departmentId: e.target.value })}>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="Instructor" hint="Optional. Creates a Mon/Wed 9:00 section."><Select value={c.instructorId} onChange={e => setC({ ...c, instructorId: e.target.value })}><option value="">No section yet</option>{teachers.filter(t => t.departmentId === c.departmentId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
          <Button type="submit">Add course</Button></form></Card></Section>
        <Section title={`Courses (${courses.length})`}><Card className="!p-0"><ul className="divide-y-2 divide-line">{courses.map(x => { const s = db.sections.find(y => y.courseId === x.id); return (
          <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5"><span><b>{x.code}</b> {x.title}<span className="muted block !text-xs">{s ? `${personName(db, s.instructorId)} · ${seatsTaken(db, s.id)}/${s.capacity}` : 'No section'}</span></span><Badge>{x.credits} cr</Badge></li>); })}</ul></Card></Section></div>)}

      {tab === 'announce' && <Card className="max-w-2xl"><form className="space-y-4" onSubmit={e => { e.preventDefault(); act(() => A.postAnnouncement(can(me, 'announce:campus') ? { ...post, scope: 'campus' } : { ...post, scope: 'department', scopeId: me.departmentId }), 'Announcement published').then(() => setPost({ title: '', body: '', pinned: false })); }}>
        <p className="muted">Posting to: <b className="text-on-surface">{can(me, 'announce:campus') ? 'the whole campus' : byId(db.departments, me.departmentId)?.name}</b></p>
        <Field label="Title"><Input required value={post.title} onChange={e => setPost({ ...post, title: e.target.value })} /></Field><Field label="Message"><Textarea required value={post.body} onChange={e => setPost({ ...post, body: e.target.value })} /></Field>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={post.pinned} onChange={e => setPost({ ...post, pinned: e.target.checked })} />Pin to the top</label><Button type="submit">Publish</Button></form></Card>}

      {tab === 'audit' && <Card className="!p-0"><ul className="divide-y-2 divide-line">{db.audit.map(a => (<li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"><span><b>{personName(db, a.actorId)}</b> <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">{a.action}</code> {a.target}</span><span className="muted !text-xs">{new Date(a.at).toLocaleString()}</span></li>))}
        {!db.audit.length && <li className="p-6"><EmptyState title="No privileged actions yet" hint="Approvals and role changes will be recorded here." /></li>}</ul></Card>}
    </>
  );
}
