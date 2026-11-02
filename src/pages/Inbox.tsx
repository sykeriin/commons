import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { useActions, useDB, useMe } from '@/src/app/session';
import { byId, mySections, personName } from '@/src/data/select';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented } from '@/src/ui';
import { relDay } from '@/src/lib/dates';
import { cn } from '@/src/lib/utils';

export default function Inbox() {
  const db = useDB(); const me = useMe()!; const A = useActions(); const [tab, setTab] = useState<'notices' | 'news'>('notices');
  const notices = db.notices.filter(n => n.personId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); const unread = notices.filter(n => !n.read).length;
  const scopes = new Set([...mySections(db, me).map(s => s.id), ...db.memberships.filter(m => m.personId === me.id).map(m => m.clubId), me.departmentId ?? '']);
  const news = db.announcements.filter(a => a.scope === 'campus' || scopes.has(a.scopeId ?? '')).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Inbox" actions={unread > 0 && tab === 'notices' ? <Button variant="outline" size="sm" onClick={() => A.markNoticesRead()}>Mark all read</Button> : undefined} />
      <Segmented className="mb-5" value={tab} onChange={setTab} options={[{ value: 'notices', label: `Notifications${unread ? ` (${unread})` : ''}` }, { value: 'news', label: 'Announcements' }]} />
      <div className="space-y-3">
        {tab === 'notices' && (notices.length ? notices.map(n => {
          const body = (<Card className={cn('flex gap-3', !n.read && '!border-ink')}><span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
            <div className="min-w-0 flex-1"><p className="font-headline font-extrabold">{n.title}</p><p className="muted">{n.body}</p><p className="muted mt-1 !text-xs">{relDay(n.createdAt.slice(0, 10))}</p></div></Card>);
          return n.link ? <Link key={n.id} to={n.link} onClick={() => A.markNoticesRead()}>{body}</Link> : <div key={n.id}>{body}</div>;
        }) : <EmptyState title="You're all caught up" />)}
        {tab === 'news' && news.map(a => (
          <Card key={a.id}><div className="flex flex-wrap items-center gap-2">{a.pinned && <Badge tone="brand"><Pin size={11} />Pinned</Badge>}<Badge className="capitalize">{a.scope}</Badge><span className="muted !text-xs">{personName(db, a.authorId)} · {relDay(a.createdAt.slice(0, 10))}</span></div>
            <h3 className="mt-2 font-headline text-lg font-extrabold">{a.title}</h3><p className="muted mt-1">{a.body}</p></Card>))}
      </div>
    </>
  );
}
