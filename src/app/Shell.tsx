import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Moon, Sun, Monitor, ArrowLeftRight, Sparkles } from 'lucide-react';
import { useSession } from './session';
import { navFor, isActive } from './nav';
import { Avatar, Sheet, Badge } from '@/src/ui';
import { ROLE_LABEL } from '@/src/lib/permissions';
import { PERSONAS } from '@/src/data/seed';
import { cn } from '@/src/lib/utils';

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="brut-sm flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-headline text-lg font-black text-on-primary">C</span>
      <span className="font-headline text-xl font-black tracking-tight">Commons</span>
    </Link>
  );
}

export const Shell: React.FC = () => {
  const { me, db, theme, setTheme, signInDemo } = useSession();
  const loc = useLocation(); const nav = useNavigate();
  const [switcher, setSwitcher] = useState(false);
  if (!me) return null;
  const items = navFor(me);
  const unread = db.notices.filter(n => n.personId === me.id && !n.read).length;
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const nextTheme = { system: 'light', light: 'dark', dark: 'system' } as const;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r-2 border-line bg-surface-container-low p-5 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Primary">
          {items.map(it => {
            const active = isActive(it, loc.pathname);
            return (
              <NavLink key={it.to} to={it.to} className={cn('flex min-h-11 items-center gap-3 rounded-xl border-2 px-3.5 font-headline text-sm font-extrabold transition-colors',
                active ? 'brut-sm bg-primary text-on-primary' : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface')}>
                <it.icon size={19} />{it.label}
                {it.to === '/inbox' && unread > 0 && <span className="ml-auto rounded-full bg-tertiary-container px-2 text-xs text-on-tertiary-container">{unread}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <button onClick={() => setSwitcher(true)} className="card card-hover flex w-full items-center gap-3 p-3 text-left">
            <Avatar name={me.name} size={38} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{me.name}</span><span className="muted block truncate !text-xs">{ROLE_LABEL[me.role]}</span></span>
            <ArrowLeftRight size={16} className="text-on-surface-variant" />
          </button>
          <button onClick={() => setTheme(nextTheme[theme])} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container"><ThemeIcon size={17} />Theme: {theme}</button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <div className="safe-top sticky top-0 z-40 border-b-2 border-line bg-background/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Brand />
            <div className="flex items-center gap-1">
              <button aria-label={`Theme: ${theme}`} onClick={() => setTheme(nextTheme[theme])} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-container"><ThemeIcon size={19} /></button>
              <button aria-label="Switch demo account" onClick={() => setSwitcher(true)} className="flex h-11 w-11 items-center justify-center"><Avatar name={me.name} size={34} /></button>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 md:px-8 lg:pb-16 lg:pt-10"><Outlet /></main>

        {/* Mobile bottom nav */}
        <nav aria-label="Primary" className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t-2 border-line bg-background/90 backdrop-blur-xl lg:hidden">
          <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1.5 pb-1.5">
            {items.map(it => {
              const active = isActive(it, loc.pathname);
              return (
                <li key={it.to} className="min-w-0 flex-1">
                  <NavLink to={it.to} aria-current={active ? 'page' : undefined} className="relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl">
                    <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', active ? 'bg-primary text-on-primary' : 'text-on-surface-variant')}><it.icon size={19} /></span>
                    <span className={cn('truncate font-headline text-[10px] font-bold', active ? 'text-on-surface' : 'text-on-surface-variant')}>{it.label}</span>
                    {it.to === '/inbox' && unread > 0 && <span className="absolute right-[22%] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <Sheet open={switcher} onClose={() => setSwitcher(false)} title="Switch demo account">
        <p className="muted mb-4 flex items-start gap-2"><Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />Try Commons from each role's point of view. Each account sees different tabs and can do different things.</p>
        <ul className="space-y-2">
          {PERSONAS.map(p => (
            <li key={p.id}>
              <button onClick={() => { signInDemo(p.id); setSwitcher(false); nav('/'); }} className={cn('card card-hover flex w-full items-center gap-3 p-3 text-left', p.id === me.id && '!border-ink')}>
                <Avatar name={p.label} size={42} /><span className="min-w-0 flex-1"><span className="block font-bold">{p.label}</span><span className="muted block !text-xs">{p.blurb}</span></span>
                {p.id === me.id && <Badge tone="lime">Current</Badge>}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
};
