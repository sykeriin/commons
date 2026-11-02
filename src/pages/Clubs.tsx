import React, { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Plus, Megaphone } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { byId, personName, isClubMember } from '@/src/data/select';
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Section, Segmented, Select, Textarea, useAction } from '@/src/ui';
import { ClubCard, EventCard } from './parts';
import { can, canManageClub, clubRoleOf } from '@/src/lib/permissions';
import { today } from '@/src/lib/dates';
import type { ClubRole } from '@/src/data/types';

const List: React.FC = () => {
  const db = useDB(); const me = useMe()!; const [tab, setTab] = useState<'all' | 'mine' | 'pending'>('all'); const [q, setQ] = useState(''); const [cat, setCat] = useState('All');
  const cats = ['All', ...Array.from(new Set(db.clubs.map(c => c.category)))];
  const mineIds = new Set(db.memberships.filter(m => m.personId === me.id).map(m => m.clubId));
  const rows = db.clubs.filter(c => {
    if (tab === 'pending') return c.approval === 'pending' && (can(me, 'approve:club') || c.presidentId === me.id);
    if (c.approval !== 'approved' && c.presidentId !== me.id) return false;
    return (tab === 'all' || mineIds.has(c.id)) && (cat === 'All' || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase());
  }).sort((a, b) => b.memberCount - a.memberCount);
  const pendingCount = db.clubs.filter(c => c.approval === 'pending' && (can(me, 'approve:club') || c.presidentId === me.id)).length;
  return (
    <>
      <PageHeader title="Clubs" subtitle={`${db.clubs.filter(c => c.approval === 'approved').length} active clubs`} actions={<Link to="/clubs/new"><Button><Plus size={16} />Start a club</Button></Link>} />
      <div className="mb-3 flex flex-wrap items-center gap-3"><Segmented value={tab} onChange={setTab} options={[{ value: 'all', label: 'Discover' }, { value: 'mine', label: 'My clubs' }, ...(pendingCount ? [{ value: 'pending' as const, label: `Pending (${pendingCount})` }] : [])]} />
        <Input aria-label="Search clubs" className="max-w-56" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="scroll-hide mb-6 flex gap-2 overflow-x-auto">{cats.map(c => <button key={c} onClick={() => setCat(c)} className={`min-h-9 shrink-0 rounded-full border-2 px-3.5 text-xs font-bold ${cat === c ? 'border-ink bg-ink text-background' : 'border-line text-on-surface-variant'}`}>{c}</button>)}</div>
      {rows.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{rows.map(c => <ClubCard key={c.id} club={c} />)}</div> : <EmptyState title="No clubs found" />}
    </>
  );
};

const ROLES: ClubRole[] = ['member', 'officer', 'president'];
const Detail: React.FC = () => {
  const { id } = useParams(); const db = useDB(); const me = useMe()!; const A = useActions(); const act = useAction();
  const club = byId(db.clubs, id); const [tab, setTab] = useState<'about' | 'members' | 'manage'>('about'); const [post, setPost] = useState({ title: '', body: '' }); const [msg, setMsg] = useState('');
  if (!club) return <EmptyState title="Club not found" />;
  const member = isClubMember(db, club.id, me.id); const mgr = canManageClub(db, me, club); const isPres = clubRoleOf(db, club.id, me.id) === 'president' || me.role === 'admin';
  const members = db.memberships.filter(m => m.clubId === club.id).sort((a, b) => ['president', 'advisor', 'officer', 'member'].indexOf(a.role) - ['president', 'advisor', 'officer', 'member'].indexOf(b.role));
  const reqs = db.joinRequests.filter(j => j.clubId === club.id && j.status === 'pending'); const myReq = db.joinRequests.find(j => j.clubId === club.id && j.personId === me.id && j.status === 'pending');
  const events = db.events.filter(e => e.clubId === club.id && e.date >= today() && e.approval === 'approved').sort((a, b) => a.date.localeCompare(b.date));
  const news = db.announcements.filter(a => a.scope === 'club' && a.scopeId === club.id);
  return (
    <>
      <Link to="/clubs" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Clubs</Link>
      <div className="brut mb-6 flex flex-wrap items-center gap-5 rounded-3xl p-6 text-white md:p-8" style={{ background: club.color }}>
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-white/70 bg-white/20 font-headline text-4xl font-black">{club.name[0]}</span>
        <div className="min-w-[15rem] flex-1"><div className="flex flex-wrap gap-2"><Badge tone="neutral" className="!bg-white/25 !text-white">{club.category}</Badge>{club.approval !== 'approved' && <Badge tone="warn">Pending approval</Badge>}</div>
          <h1 className="mt-2 font-headline text-3xl font-black leading-none md:text-5xl">{club.name}</h1><p className="mt-2 text-sm font-bold opacity-90">{club.memberCount} members · President {personName(db, club.presidentId)}{club.advisorId ? ` · Advisor ${personName(db, club.advisorId)}` : ''}</p></div>
        {club.approval === 'approved' && (member ? (clubRoleOf(db, club.id, me.id) !== 'president' && <Button variant="outline" onClick={() => act(() => A.leaveClub(club.id), 'You left the club')}>Leave</Button>)
          : myReq ? <Badge tone="warn">Request sent</Badge>
          : club.joinPolicy === 'request' ? <Button variant="accent" onClick={() => act(() => A.requestJoin(club.id, msg || 'Hi, I would like to join!'), 'Request sent')}>Request to join</Button>
          : <Button variant="accent" onClick={() => act(() => A.joinClub(club.id), `Welcome to ${club.name}!`)}>Join club</Button>)}
      </div>

      {club.approval === 'pending' && can(me, 'approve:club') && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 !border-warn"><p className="font-bold">This club is waiting for approval.</p>
          <div className="flex gap-2"><Button size="sm" onClick={() => act(() => A.decideClub(club.id, 'approved'), 'Club approved')}>Approve</Button><Button size="sm" variant="danger" onClick={() => act(() => A.decideClub(club.id, 'rejected'), 'Club rejected')}>Reject</Button></div></Card>)}

      <Segmented className="mb-6" value={tab} onChange={setTab} options={[{ value: 'about', label: 'About' }, { value: 'members', label: `Members (${members.length})` }, ...(mgr ? [{ value: 'manage' as const, label: `Manage${reqs.length ? ` (${reqs.length})` : ''}` }] : [])]} />

      {tab === 'about' && <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]"><div><p className="max-w-2xl text-base font-medium leading-relaxed">{club.description}</p>
        {club.joinPolicy === 'request' && !member && <p className="muted mt-3">Joining requires approval from the club's officers.</p>}
        <Section title="Upcoming events" className="mt-8"><div className="space-y-3">{events.map(e => <EventCard key={e.id} ev={e} compact />)}{!events.length && <p className="muted">Nothing scheduled.</p>}</div></Section></div>
        <Section title="Club news"><div className="space-y-3">{news.map(n => <Card key={n.id}><p className="font-headline font-extrabold">{n.title}</p><p className="muted mt-1">{n.body}</p></Card>)}{!news.length && <p className="muted">No posts yet.</p>}</div></Section></div>}

      {tab === 'members' && <Card className="!p-0"><ul className="divide-y-2 divide-line">{members.map(m => { const p = byId(db.people, m.personId)!; return (
        <li key={m.id} className="flex items-center gap-3 px-4 py-3"><Link to={`/people/${p.id}`}><Avatar name={p.name} size={38} /></Link><Link to={`/people/${p.id}`} className="flex-1 font-bold hover:underline">{p.name}</Link>
          <Badge tone={m.role === 'member' ? 'neutral' : m.role === 'advisor' ? 'blue' : 'lime'}><span className="capitalize">{m.role}</span></Badge></li>); })}</ul></Card>}

      {tab === 'manage' && <div className="grid gap-8 lg:grid-cols-2"><div>
        <Section title={`Join requests (${reqs.length})`}><div className="space-y-3">{reqs.map(r => (
          <Card key={r.id}><p className="font-bold">{personName(db, r.personId)}</p><p className="muted mt-0.5">“{r.message}”</p>
            <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => act(() => A.decideJoin(r.id, 'approved'), 'Approved')}>Accept</Button><Button size="sm" variant="outline" onClick={() => act(() => A.decideJoin(r.id, 'rejected'), 'Declined')}>Decline</Button></div></Card>))}
          {!reqs.length && <p className="muted">No pending requests.</p>}</div></Section>
        <Section title="Post an announcement"><Card><form className="space-y-3" onSubmit={e => { e.preventDefault(); act(() => A.postAnnouncement({ ...post, scope: 'club', scopeId: club.id }), 'Posted').then(() => setPost({ title: '', body: '' })); }}>
          <Input required placeholder="Title" aria-label="Title" value={post.title} onChange={e => setPost({ ...post, title: e.target.value })} /><Textarea required placeholder="Message" aria-label="Message" value={post.body} onChange={e => setPost({ ...post, body: e.target.value })} />
          <div className="flex gap-2"><Button type="submit"><Megaphone size={15} />Post</Button><Link to="/events/new"><Button type="button" variant="outline">Create event</Button></Link></div></form></Card></Section></div>
        <Section title="Member roles"><Card className="!p-0"><ul className="divide-y-2 divide-line">{members.filter(m => m.role !== 'advisor').map(m => (
          <li key={m.id} className="flex items-center gap-2 px-4 py-2.5"><span className="flex-1 truncate text-sm font-bold">{personName(db, m.personId)}</span>
            {isPres && m.role !== 'president' ? <Select aria-label={`Role of ${personName(db, m.personId)}`} className="!w-32" value={m.role} onChange={e => act(() => A.setMemberRole(m.id, e.target.value as ClubRole), 'Role updated')}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</Select> : <Badge><span className="capitalize">{m.role}</span></Badge>}
            {m.role !== 'president' && <Button size="sm" variant="ghost" onClick={() => act(() => A.removeMember(m.id), 'Removed')}>Remove</Button>}</li>))}</ul></Card></Section></div>}
    </>
  );
};

const New: React.FC = () => {
  const db = useDB(); const A = useActions(); const act = useAction(); const nav = useNavigate(); const me = useMe()!;
  const [f, setF] = useState({ name: '', description: '', category: 'Tech', color: '#004be2', advisorId: '', joinPolicy: 'open' as 'open' | 'request' });
  const auto = me.role === 'admin' || me.role === 'staff';
  return (
    <>
      <Link to="/clubs" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Clubs</Link>
      <PageHeader title="Start a club" subtitle="You'll be the president." />
      <form className="card max-w-2xl space-y-5 p-5 md:p-6" onSubmit={async e => { e.preventDefault(); const id = await act(() => A.createClub({ ...f, advisorId: f.advisorId || undefined }), auto ? 'Club created' : 'Submitted for approval'); if (id) nav(`/clubs/${id}`); }}>
        <Field label="Club name"><Input required maxLength={60} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="What is it about?"><Textarea required value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category"><Select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{['Tech', 'Arts', 'Sports', 'Design', 'Games', 'Service', 'Academic', 'Business', 'Science'].map(c => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Faculty advisor" hint="Recommended. Staff will ask if missing."><Select value={f.advisorId} onChange={e => setF({ ...f, advisorId: e.target.value })}><option value="">None yet</option>{db.people.filter(p => p.role === 'faculty' || p.role === 'dept_head').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Joining"><Select value={f.joinPolicy} onChange={e => setF({ ...f, joinPolicy: e.target.value as any })}><option value="open">Anyone can join</option><option value="request">Officers approve requests</option></Select></Field>
          <Field label="Colour"><Input type="color" className="!p-1" value={f.color} onChange={e => setF({ ...f, color: e.target.value })} /></Field>
        </div>
        {!auto && <p className="rounded-xl bg-warn/15 p-3 text-sm font-semibold text-warn">New clubs are reviewed by student affairs before they appear in Discover.</p>}
        <Button type="submit" size="lg">{auto ? 'Create club' : 'Submit for approval'}</Button>
      </form>
    </>
  );
};

export default function Clubs() {
  return <Routes><Route index element={<List />} /><Route path="new" element={<New />} /><Route path=":id" element={<Detail />} /></Routes>;
}
