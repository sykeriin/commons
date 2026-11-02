import type { DB, Person, Section } from './types';
import { minutes } from '@/src/lib/dates';

export const byId = <T extends { id: string }>(arr: T[], id?: string) => (id ? arr.find(x => x.id === id) : undefined);
export const personName = (db: DB, id?: string) => byId(db.people, id)?.name ?? 'Unknown';
export const placeLabel = (db: DB, id: string) => { const p = byId(db.places, id); return p ? `${p.name}, ${p.building}` : id; };

export function sectionInfo(db: DB, s: Section) {
  const course = byId(db.courses, s.courseId)!; return { section: s, course, instructor: byId(db.people, s.instructorId), department: byId(db.departments, course.departmentId) };
}
export const mySections = (db: DB, me: Person) =>
  me.role === 'student'
    ? db.enrollments.filter(e => e.studentId === me.id && e.status === 'enrolled').map(e => byId(db.sections, e.sectionId)!).filter(Boolean)
    : db.sections.filter(s => s.instructorId === me.id);

export function timetable(db: DB, sections: Section[]) {
  return sections.flatMap(s => s.slots.map(sl => ({ ...sl, ...sectionInfo(db, s) }))).sort((a, b) => a.day - b.day || minutes(a.start) - minutes(b.start));
}
export function attendancePct(db: DB, sectionId: string, studentId: string) {
  const rec = db.attendance.filter(a => a.sectionId === sectionId && a.studentId === studentId);
  if (!rec.length) return null;
  return Math.round(rec.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'excused').length / rec.length * 100);
}
const GP: Record<string, number> = { 'A': 4, 'A-': 3.7, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'C+': 2.3, 'C': 2, 'D': 1, 'F': 0 };
export const GRADE_OPTIONS = Object.keys(GP);
export function gpa(db: DB, studentId: string) {
  let pts = 0, cr = 0;
  db.enrollments.filter(e => e.studentId === studentId && e.status === 'enrolled' && e.grade).forEach(e => {
    const s = byId(db.sections, e.sectionId)!; const c = byId(db.courses, s.courseId)!; pts += GP[e.grade!] * c.credits; cr += c.credits;
  });
  return cr ? pts / cr : null;
}
export const seatsTaken = (db: DB, sectionId: string) => db.enrollments.filter(e => e.sectionId === sectionId && e.status === 'enrolled').length;
export const goingCount = (db: DB, eventId: string) => db.rsvps.filter(r => r.eventId === eventId && r.status === 'going').length;
export const isClubMember = (db: DB, clubId: string, personId?: string) => db.memberships.some(m => m.clubId === clubId && m.personId === personId);
export const visibleEvents = (db: DB, me: Person | null) => db.events.filter(e => e.approval === 'approved' || e.organizerId === me?.id || me?.role === 'admin' || me?.role === 'staff');
