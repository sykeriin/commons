import type { DB, Person, Section, Club, CampusEvent } from '@/src/data/types';

export const ROLE_LABEL: Record<Person['role'], string> = {
  student: 'Student', faculty: 'Faculty', staff: 'Staff', dept_head: 'Department head', admin: 'Administrator',
};
export const isStaffLike = (p?: Person | null) => !!p && (p.role === 'staff' || p.role === 'admin');
export const isTeacher = (p?: Person | null) => !!p && (p.role === 'faculty' || p.role === 'dept_head');

export type Action =
  | 'manage:console' | 'manage:users' | 'manage:roles' | 'manage:departments' | 'manage:courses'
  | 'approve:club' | 'approve:event' | 'audit:view' | 'teach' | 'announce:campus' | 'club:create' | 'event:create';

export function can(p: Person | null | undefined, action: Action): boolean {
  if (!p) return false;
  switch (action) {
    case 'manage:console': return p.role !== 'student' && p.role !== 'faculty';
    case 'manage:users': case 'manage:roles': case 'audit:view': return p.role === 'admin';
    case 'manage:departments': return p.role === 'admin';
    case 'manage:courses': return p.role === 'admin' || p.role === 'dept_head';
    case 'approve:club': case 'approve:event': return p.role === 'admin' || p.role === 'staff';
    case 'teach': return isTeacher(p);
    case 'announce:campus': return p.role === 'admin' || p.role === 'staff';
    case 'club:create': case 'event:create': return true;
  }
}
export const canGrade = (p: Person | null | undefined, s: Section) =>
  !!p && (p.id === s.instructorId || p.role === 'admin');
export function clubRoleOf(db: DB, clubId: string, personId?: string) {
  return db.memberships.find(m => m.clubId === clubId && m.personId === personId)?.role;
}
export function canManageClub(db: DB, p: Person | null | undefined, club: Club) {
  if (!p) return false;
  if (p.role === 'admin') return true;
  const r = clubRoleOf(db, club.id, p.id);
  return r === 'president' || r === 'officer' || r === 'advisor';
}
export function canEditEvent(db: DB, p: Person | null | undefined, ev: CampusEvent) {
  if (!p) return false;
  if (p.role === 'admin' || p.role === 'staff' || ev.organizerId === p.id) return true;
  return !!ev.clubId && !!clubRoleOf(db, ev.clubId, p.id) && ['president', 'officer'].includes(clubRoleOf(db, ev.clubId, p.id)!);
}
/** Campus-wide events always need staff approval; club/department events by officers are auto-approved only for staff+. */
export function initialEventApproval(p: Person, scope: CampusEvent['scope']) {
  if (p.role === 'admin' || p.role === 'staff') return 'approved' as const;
  return scope === 'campus' ? 'pending' as const : 'approved' as const;
}
