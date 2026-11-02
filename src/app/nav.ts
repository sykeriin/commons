import { Home, GraduationCap, Compass, Bell, UserRound, Shield, BookOpenCheck } from 'lucide-react';
import type { Person } from '@/src/data/types';
import { can } from '@/src/lib/permissions';

export interface NavItem { to: string; label: string; icon: any; match: string[] }
export function navFor(me: Person): NavItem[] {
  const items: NavItem[] = [{ to: '/', label: 'Today', icon: Home, match: ['/'] }];
  if (me.role === 'student') items.push({ to: '/academics', label: 'Academics', icon: GraduationCap, match: ['/academics'] });
  else if (can(me, 'teach')) items.push({ to: '/teaching', label: 'Teaching', icon: BookOpenCheck, match: ['/teaching'] });
  items.push({ to: '/campus', label: 'Campus', icon: Compass, match: ['/campus', '/events', '/clubs', '/departments', '/people', '/places'] });
  if (can(me, 'manage:console')) items.push({ to: '/manage', label: 'Manage', icon: Shield, match: ['/manage'] });
  items.push({ to: '/inbox', label: 'Inbox', icon: Bell, match: ['/inbox'] }, { to: '/me', label: 'Me', icon: UserRound, match: ['/me', '/about', '/privacy'] });
  return items;
}
export const isActive = (item: NavItem, path: string) => item.to === '/' ? path === '/' : item.match.some(m => path === m || path.startsWith(m + '/'));
