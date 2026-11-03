import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, RotateCcw, Info, ShieldCheck } from 'lucide-react';
import { useActions, useDB, useMe, useSession } from '@/src/app/session';
import { byId, gpa } from '@/src/data/select';
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Section, Segmented, Select, StatTile, Textarea, useAction } from '@/src/ui';
import { ROLE_LABEL } from '@/src/lib/permissions';
import { relDay } from '@/src/lib/dates';
import type { Role } from '@/src/data/types';

export default function Me() {
  const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction(); const { theme, setTheme, signOut, resetDemo, store } = useSession();
  const [f, setF] = useState({ name: me.name, bio: me.bio ?? '', departmentId: me.departmentId ?? '', year: me.year ?? 1 });
  const [req, setReq] = useState<{ role: Role; reason: string }>({ role: 'faculty', reason: '' });
  const reqs = db.roleRequests.filter(r => r.personId === me.id); const pending = reqs.some(r => r.status === 'pending');
  const g = gpa(db, me.id); const clubs = db.memberships.filter(m => m.personId === me.id).length;
  return (
    <>
      <PageHeader title="Me" />
      <Card className="mb-6 flex flex-wrap items-center gap-5"><Avatar name={me.name} size={72} /><div className="flex-1"><h2 className="font-headline text-2xl font-black">{me.name}</h2><p className="muted">{me.email}</p>
        <div className="mt-2 flex flex-wrap gap-2"><Badge tone="lime">{ROLE_LABEL[me.role]}</Badge>{me.departmentId && <Badge color={byId(db.departments, me.departmentId)?.color}>{byId(db.departments, me.departmentId)?.name}</Badge>}</div></div></Card>
      {me.role === 'student' && <div className="mb-8 grid grid-cols-3 gap-3"><StatTile label="GPA" value={g ? g.toFixed(2) : '–'} /><StatTile label="Clubs" value={clubs} /><StatTile label="Karma" value={me.karma} /></div>}

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Profile"><Card><form className="space-y-4" onSubmit={e => { e.preventDefault(); act(() => A.updateProfile(me.id, { name: f.name, bio: f.bio, departmentId: f.departmentId || undefined, year: me.role === 'student' ? +f.year : undefined }), 'Profile saved'); }}>
          <Field label="Name"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Bio"><Textarea rows={3} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Department"><Select value={f.departmentId} onChange={e => setF({ ...f, departmentId: e.target.value })}><option value="">None</option>{db.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
            {me.role === 'student' && <Field label="Year"><Select value={f.year} onChange={e => setF({ ...f, year: +e.target.value })}>{[1, 2, 3, 4].map(y => <option key={y}>{y}</option>)}</Select></Field>}</div>
          <Button type="submit">Save changes</Button></form></Card></Section>

        <div>
          {me.role === 'student' && <Section title="Request faculty or staff access"><Card>
            <p className="muted mb-3">Roles control what you can do. Everyone starts as a student, and an administrator verifies and approves anything higher.</p>
            {reqs.map(r => <p key={r.id} className="mb-2 flex items-center gap-2 text-sm font-semibold">{ROLE_LABEL[r.requested]} <Badge tone={r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : 'warn'}>{r.status}</Badge><span className="muted !text-xs">{relDay(r.createdAt.slice(0, 10))}</span></p>)}
            {!pending && <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); act(() => A.requestRole(me.id, req.role, req.reason), 'Request sent to administrators').then(() => setReq({ ...req, reason: '' })); }}>
              <Field label="I am a…"><Select value={req.role} onChange={e => setReq({ ...req, role: e.target.value as Role })}><option value="faculty">Faculty / professor</option><option value="staff">Staff</option></Select></Field>
              <Field label="Why?"><Textarea rows={2} required value={req.reason} onChange={e => setReq({ ...req, reason: e.target.value })} placeholder="Department, position, supervisor…" /></Field><Button type="submit">Send request</Button></form>}</Card></Section>}

          <Section title="App"><Card className="space-y-4"><div><p className="label">Theme</p><Segmented value={theme} onChange={setTheme} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div>
            <div className="flex flex-wrap gap-2"><Link to="/about"><Button variant="outline" size="sm"><Info size={15} />About</Button></Link><Link to="/privacy"><Button variant="outline" size="sm"><ShieldCheck size={15} />Privacy</Button></Link>
              {store.kind === 'demo' && <Button variant="outline" size="sm" onClick={() => { if (confirm('Reset all demo data?')) resetDemo(); }}><RotateCcw size={15} />Reset demo data</Button>}
              <Button variant="danger" size="sm" onClick={signOut}><LogOut size={15} />Sign out</Button></div></Card></Section>
        </div>
      </div>
    </>
  );
}
