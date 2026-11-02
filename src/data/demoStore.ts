import { EMPTY_DB, type DB, type Role } from './types';
import type { Actions, Store } from './store';
import { buildSeed } from './seed';
import { can, canGrade, canManageClub, initialEventApproval } from '@/src/lib/permissions';
import { today } from '@/src/lib/dates';

const KEY = 'commons.demo.v1';
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s.day === today() && s.db) return { ...EMPTY_DB, ...s.db }; }
  } catch { /* storage unavailable or corrupt: fall through to a fresh seed */ }
  return buildSeed();
}

export class DemoStore implements Store {
  readonly kind = 'demo' as const;
  actorId: string | null;
  private db: DB;
  private subs = new Set<() => void>();
  constructor(actorId: string | null) { this.actorId = actorId; this.db = load(); }

  getState = () => this.db;
  subscribe = (fn: () => void) => { this.subs.add(fn); return () => { this.subs.delete(fn); }; };
  reset() { this.set(() => buildSeed()); }

  private set(fn: (d: DB) => DB) {
    this.db = fn(this.db);
    try { localStorage.setItem(KEY, JSON.stringify({ day: today(), db: this.db })); } catch { /* ignore */ }
    this.subs.forEach(s => s());
  }
  private me() { const p = this.db.people.find(x => x.id === this.actorId); if (!p) throw new Error('Not signed in'); return p; }
  private audit(action: string, target: string) {
    this.set(d => ({ ...d, audit: [{ id: uid('au'), actorId: this.actorId!, action, target, at: nowISO() }, ...d.audit].slice(0, 200) }));
  }
  private notify(personId: string, title: string, body: string, link?: string) {
    this.set(d => ({ ...d, notices: [{ id: uid('nt'), personId, title, body, createdAt: nowISO(), read: false, link }, ...d.notices] }));
  }
  private recount(clubId: string) {
    this.set(d => ({ ...d, clubs: d.clubs.map(c => c.id === clubId ? { ...c, memberCount: d.memberships.filter(m => m.clubId === clubId).length } : c) }));
  }
  private promoteWaitlist(eventId: string) {
    const d = this.db; const ev = d.events.find(e => e.id === eventId); if (!ev?.capacity) return;
    const going = d.rsvps.filter(r => r.eventId === eventId && r.status === 'going').length;
    const next = d.rsvps.filter(r => r.eventId === eventId && r.status === 'waitlist').sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (next && going < ev.capacity) {
      this.set(x => ({ ...x, rsvps: x.rsvps.map(r => r.id === next.id ? { ...r, status: 'going' } : r) }));
      this.notify(next.personId, 'You\'re off the waitlist', `A spot opened up for ${ev.title}.`, `/events/${ev.id}`);
    }
  }

  actions: Actions = {
    enroll: async (sectionId, studentId) => {
      const d = this.db; const me = this.me();
      if (me.id !== studentId && me.role !== 'admin') throw new Error('Not allowed');
      const existing = d.enrollments.find(e => e.sectionId === sectionId && e.studentId === studentId);
      if (existing && existing.status !== 'dropped') return existing.status as 'enrolled' | 'waitlisted';
      const sec = d.sections.find(s => s.id === sectionId)!;
      const taken = d.enrollments.filter(e => e.sectionId === sectionId && e.status === 'enrolled').length;
      const status = taken >= sec.capacity ? 'waitlisted' : 'enrolled';
      this.set(x => ({ ...x, enrollments: [...x.enrollments.filter(e => e !== existing), { id: existing?.id ?? uid('en'), sectionId, studentId, status }] }));
      return status;
    },
    drop: async (sectionId, studentId) => {
      const me = this.me(); if (me.id !== studentId && me.role !== 'admin') throw new Error('Not allowed');
      this.set(d => ({ ...d, enrollments: d.enrollments.map(e => e.sectionId === sectionId && e.studentId === studentId ? { ...e, status: 'dropped' } : e) }));
      const next = this.db.enrollments.filter(e => e.sectionId === sectionId && e.status === 'waitlisted')[0];
      const sec = this.db.sections.find(s => s.id === sectionId)!;
      if (next && this.db.enrollments.filter(e => e.sectionId === sectionId && e.status === 'enrolled').length < sec.capacity) {
        this.set(d => ({ ...d, enrollments: d.enrollments.map(e => e.id === next.id ? { ...e, status: 'enrolled' } : e) }));
        this.notify(next.studentId, 'Enrolled from waitlist', 'A seat opened up and you were enrolled.', '/academics');
      }
    },
    saveAttendance: async (sectionId, date, entries) => {
      const sec = this.db.sections.find(s => s.id === sectionId)!; if (!canGrade(this.me(), sec)) throw new Error('Only the instructor can take attendance');
      this.set(d => ({ ...d, attendance: [...d.attendance.filter(a => !(a.sectionId === sectionId && a.date === date)),
        ...entries.map(e => ({ id: `at-${e.studentId}-${sectionId}-${date}`, sectionId, date, studentId: e.studentId, status: e.status }))] }));
    },
    setGrade: async (enrollmentId, grade) => {
      const en = this.db.enrollments.find(e => e.id === enrollmentId)!; const sec = this.db.sections.find(s => s.id === en.sectionId)!;
      if (!canGrade(this.me(), sec)) throw new Error('Only the instructor can grade');
      this.set(d => ({ ...d, enrollments: d.enrollments.map(e => e.id === enrollmentId ? { ...e, grade } : e) }));
      this.notify(en.studentId, 'Grade posted', `Your final grade for ${sec.courseId.toUpperCase()} is ${grade}.`, '/academics');
    },
    setScore: async (assignmentId, studentId, score) => {
      const a = this.db.assignments.find(x => x.id === assignmentId)!; const sec = this.db.sections.find(s => s.id === a.sectionId)!;
      if (!canGrade(this.me(), sec)) throw new Error('Only the instructor can grade');
      this.set(d => {
        const ex = d.submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
        return { ...d, submissions: ex ? d.submissions.map(s => s === ex ? { ...s, score } : s) : [...d.submissions, { id: uid('su'), assignmentId, studentId, score, submittedAt: nowISO() }] };
      });
    },
    submitAssignment: async (assignmentId, studentId) => {
      if (this.me().id !== studentId) throw new Error('Not allowed');
      this.set(d => d.submissions.some(s => s.assignmentId === assignmentId && s.studentId === studentId) ? d
        : { ...d, submissions: [...d.submissions, { id: uid('su'), assignmentId, studentId, submittedAt: nowISO() }] });
    },
    createAssignment: async a => {
      const sec = this.db.sections.find(s => s.id === a.sectionId)!; if (!canGrade(this.me(), sec)) throw new Error('Only the instructor can post assignments');
      this.set(d => ({ ...d, assignments: [...d.assignments, { id: uid('as'), ...a }] }));
      this.db.enrollments.filter(e => e.sectionId === a.sectionId && e.status === 'enrolled').forEach(e => this.notify(e.studentId, 'New assignment', a.title, '/academics'));
    },
    createCourse: async c => {
      const me = this.me(); if (!can(me, 'manage:courses') || (me.role === 'dept_head' && me.departmentId !== c.departmentId)) throw new Error('Not allowed');
      const { section, ...course } = c; const id = course.code.toLowerCase().replace(/\s+/g, '');
      this.set(d => ({ ...d, courses: [...d.courses, { ...course, id }],
        sections: section ? [...d.sections, { id: `sec-${id}`, courseId: id, term: 'Fall 2026', ...section }] : d.sections }));
      this.audit('course.create', course.code);
    },
    saveDepartment: async dep => {
      if (!can(this.me(), 'manage:departments')) throw new Error('Not allowed');
      this.set(d => dep.id && d.departments.some(x => x.id === dep.id)
        ? { ...d, departments: d.departments.map(x => x.id === dep.id ? { ...x, ...dep } : x) }
        : { ...d, departments: [...d.departments, { id: dep.code.toLowerCase(), color: '#004be2', description: '', building: '', ...dep } as any] });
      this.audit('department.save', dep.name);
    },
    setPersonRole: async (personId, role) => {
      if (!can(this.me(), 'manage:roles')) throw new Error('Only administrators can change roles');
      this.set(d => ({ ...d, people: d.people.map(p => p.id === personId ? { ...p, role } : p) }));
      this.audit('role.set', `${personId} → ${role}`);
    },
    setPersonDepartment: async (personId, departmentId) => {
      if (!can(this.me(), 'manage:users')) throw new Error('Not allowed');
      this.set(d => ({ ...d, people: d.people.map(p => p.id === personId ? { ...p, departmentId } : p) }));
      this.audit('person.department', `${personId} → ${departmentId}`);
    },
    updateProfile: async (personId, patch) => {
      const me = this.me(); if (me.id !== personId && me.role !== 'admin') throw new Error('Not allowed');
      this.set(d => ({ ...d, people: d.people.map(p => p.id === personId ? { ...p, ...patch } : p) }));
    },
    requestRole: async (personId, requested, reason) => {
      if (this.me().id !== personId) throw new Error('Not allowed');
      if (requested === 'student') return;
      this.set(d => ({ ...d, roleRequests: [{ id: uid('rr'), personId, requested, reason, status: 'pending', createdAt: nowISO() }, ...d.roleRequests] }));
    },
    decideRole: async (requestId, decision) => {
      if (!can(this.me(), 'manage:roles')) throw new Error('Only administrators can approve roles');
      const rr = this.db.roleRequests.find(r => r.id === requestId)!;
      this.set(d => ({ ...d, roleRequests: d.roleRequests.map(r => r.id === requestId ? { ...r, status: decision } : r),
        people: decision === 'approved' ? d.people.map(p => p.id === rr.personId ? { ...p, role: rr.requested } : p) : d.people }));
      this.notify(rr.personId, `Role request ${decision}`, `Your request to become ${rr.requested.replace('_', ' ')} was ${decision}.`);
      this.audit(`role.${decision}`, `${rr.personId} → ${rr.requested}`);
    },
    createClub: async c => {
      const me = this.me(); const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5);
      const approval = me.role === 'admin' || me.role === 'staff' ? 'approved' : 'pending';
      this.set(d => ({ ...d, clubs: [...d.clubs, { id, ...c, presidentId: me.id, approval, memberCount: 1, createdAt: nowISO() }],
        memberships: [...d.memberships, { id: uid('m'), clubId: id, personId: me.id, role: 'president', joinedAt: nowISO() }] }));
      return id;
    },
    decideClub: async (clubId, decision) => {
      if (!can(this.me(), 'approve:club')) throw new Error('Only staff can approve clubs');
      const club = this.db.clubs.find(c => c.id === clubId)!;
      this.set(d => ({ ...d, clubs: d.clubs.map(c => c.id === clubId ? { ...c, approval: decision } : c) }));
      this.notify(club.presidentId, `Club ${decision}`, `${club.name} was ${decision}.`, `/clubs/${clubId}`);
      this.audit(`club.${decision}`, club.name);
    },
    joinClub: async clubId => {
      const me = this.me(); if (this.db.memberships.some(m => m.clubId === clubId && m.personId === me.id)) return;
      this.set(d => ({ ...d, memberships: [...d.memberships, { id: uid('m'), clubId, personId: me.id, role: 'member', joinedAt: nowISO() }] }));
      this.recount(clubId);
    },
    leaveClub: async clubId => {
      const me = this.me(); const m = this.db.memberships.find(x => x.clubId === clubId && x.personId === me.id);
      if (m?.role === 'president') throw new Error('Transfer the presidency before leaving');
      this.set(d => ({ ...d, memberships: d.memberships.filter(x => x !== m) })); this.recount(clubId);
    },
    requestJoin: async (clubId, message) => {
      const me = this.me();
      if (this.db.joinRequests.some(j => j.clubId === clubId && j.personId === me.id && j.status === 'pending')) return;
      this.set(d => ({ ...d, joinRequests: [...d.joinRequests, { id: uid('jr'), clubId, personId: me.id, status: 'pending', message }] }));
      const club = this.db.clubs.find(c => c.id === clubId)!; this.notify(club.presidentId, 'New join request', `${me.name} wants to join ${club.name}.`, `/clubs/${clubId}`);
    },
    decideJoin: async (requestId, decision) => {
      const jr = this.db.joinRequests.find(j => j.id === requestId)!; const club = this.db.clubs.find(c => c.id === jr.clubId)!;
      if (!canManageClub(this.db, this.me(), club)) throw new Error('Not allowed');
      this.set(d => ({ ...d, joinRequests: d.joinRequests.map(j => j.id === requestId ? { ...j, status: decision } : j),
        memberships: decision === 'approved' ? [...d.memberships, { id: uid('m'), clubId: jr.clubId, personId: jr.personId, role: 'member', joinedAt: nowISO() }] : d.memberships }));
      this.recount(jr.clubId); this.notify(jr.personId, `Join request ${decision}`, `${club.name}: your request was ${decision}.`, `/clubs/${club.id}`);
    },
    setMemberRole: async (membershipId, role) => {
      const m = this.db.memberships.find(x => x.id === membershipId)!; const club = this.db.clubs.find(c => c.id === m.clubId)!;
      const me = this.me(); const isPres = this.db.memberships.some(x => x.clubId === club.id && x.personId === me.id && x.role === 'president') || me.role === 'admin';
      if (!isPres) throw new Error('Only the president can change roles');
      this.set(d => ({ ...d, memberships: d.memberships.map(x => x.id === membershipId ? { ...x, role } : x),
        clubs: role === 'president' ? d.clubs.map(c => c.id === club.id ? { ...c, presidentId: m.personId } : c) : d.clubs }));
    },
    removeMember: async membershipId => {
      const m = this.db.memberships.find(x => x.id === membershipId)!; const club = this.db.clubs.find(c => c.id === m.clubId)!;
      if (!canManageClub(this.db, this.me(), club) || m.role === 'president') throw new Error('Not allowed');
      this.set(d => ({ ...d, memberships: d.memberships.filter(x => x.id !== membershipId) })); this.recount(club.id);
    },
    createEvent: async e => {
      const me = this.me(); const id = uid('ev');
      if (e.scope === 'club') {
        const club = this.db.clubs.find(c => c.id === e.clubId); if (!club || !canManageClub(this.db, me, club)) throw new Error('Only club officers can create club events');
      }
      const approval = initialEventApproval(me, e.scope);
      this.set(d => ({ ...d, events: [...d.events, { ...e, id, organizerId: me.id, approval, createdAt: nowISO() }] }));
      return id;
    },
    decideEvent: async (eventId, decision) => {
      if (!can(this.me(), 'approve:event')) throw new Error('Only staff can approve events');
      const ev = this.db.events.find(e => e.id === eventId)!;
      this.set(d => ({ ...d, events: d.events.map(e => e.id === eventId ? { ...e, approval: decision } : e) }));
      this.notify(ev.organizerId, `Event ${decision}`, `${ev.title} was ${decision}.`, `/events/${eventId}`); this.audit(`event.${decision}`, ev.title);
    },
    deleteEvent: async eventId => {
      this.set(d => ({ ...d, events: d.events.filter(e => e.id !== eventId), rsvps: d.rsvps.filter(r => r.eventId !== eventId) }));
    },
    rsvp: async (eventId, status) => {
      const me = this.me(); const ev = this.db.events.find(e => e.id === eventId)!;
      const going = this.db.rsvps.filter(r => r.eventId === eventId && r.status === 'going').length;
      const final = status === 'going' && ev.capacity && going >= ev.capacity ? 'waitlist' : status;
      this.set(d => ({ ...d, rsvps: [...d.rsvps.filter(r => !(r.eventId === eventId && r.personId === me.id)),
        { id: uid('rs'), eventId, personId: me.id, status: final, checkedIn: false, createdAt: nowISO() }] }));
      return final;
    },
    cancelRsvp: async eventId => {
      const me = this.me();
      this.set(d => ({ ...d, rsvps: d.rsvps.filter(r => !(r.eventId === eventId && r.personId === me.id)) })); this.promoteWaitlist(eventId);
    },
    checkIn: async (rsvpId, value) => {
      const r = this.db.rsvps.find(x => x.id === rsvpId)!; const ev = this.db.events.find(e => e.id === r.eventId)!;
      const club = ev.clubId ? this.db.clubs.find(c => c.id === ev.clubId) : undefined; const me = this.me();
      if (!(me.id === ev.organizerId || me.role === 'admin' || me.role === 'staff' || (club && canManageClub(this.db, me, club)))) throw new Error('Not allowed');
      this.set(d => ({ ...d, rsvps: d.rsvps.map(x => x.id === rsvpId ? { ...x, checkedIn: value } : x) }));
    },
    postAnnouncement: async a => {
      const me = this.me();
      if (a.scope === 'campus' && !can(me, 'announce:campus')) throw new Error('Only staff can post campus-wide announcements');
      if (a.scope === 'course' && !canGrade(me, this.db.sections.find(s => s.id === a.scopeId)!)) throw new Error('Only the instructor can post here');
      if (a.scope === 'department' && !(me.role === 'admin' || (me.role === 'dept_head' && me.departmentId === a.scopeId))) throw new Error('Only the department head can post here');
      if (a.scope === 'club' && !canManageClub(this.db, me, this.db.clubs.find(c => c.id === a.scopeId)!)) throw new Error('Only club officers can post here');
      this.set(d => ({ ...d, announcements: [{ id: uid('an'), ...a, authorId: me.id, createdAt: nowISO() }, ...d.announcements] }));
    },
    addOfficeHour: async o => {
      const me = this.me(); if (!can(me, 'teach')) throw new Error('Not allowed');
      this.set(d => ({ ...d, officeHours: [...d.officeHours, { id: uid('oh'), facultyId: me.id, booked: [], ...o }] }));
    },
    bookOfficeHour: async id => {
      const me = this.me();
      this.set(d => ({ ...d, officeHours: d.officeHours.map(o => o.id === id && !(o.booked ?? []).length ? { ...o, booked: [me.id] } : o) }));
    },
    cancelOfficeHour: async id => {
      const me = this.me();
      this.set(d => ({ ...d, officeHours: d.officeHours.map(o => o.id === id ? { ...o, booked: (o.booked ?? []).filter(x => x !== me.id) } : o) }));
    },
    markNoticesRead: async () => {
      const me = this.me(); this.set(d => ({ ...d, notices: d.notices.map(n => n.personId === me.id ? { ...n, read: true } : n) }));
    },
  };
}
export type { Role };
