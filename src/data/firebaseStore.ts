import { collection, doc, getDoc, onSnapshot, query, setDoc, where, writeBatch, type Firestore, type Query, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable, type Functions } from 'firebase/functions';
import type { DB, Enrollment, Person } from './types';
import { EMPTY_DB } from './types';
import { DemoStore } from './demoStore';
import { buildSeed } from './seed';
import { BOOTSTRAP_ADMIN_EMAIL } from '@/src/lib/config';

/** The server-side seat logic (Cloud Functions). Injected so tests can call the handlers directly. */
export interface ServerApi {
  enroll(sectionId: string, studentId: string): Promise<'enrolled' | 'waitlisted'>;
  drop(sectionId: string, studentId: string): Promise<void>;
  rsvp(eventId: string, status: 'going' | 'maybe'): Promise<'going' | 'waitlist' | 'maybe'>;
  cancelRsvp(eventId: string): Promise<void>;
}
export const callableApi = (fns: Functions): ServerApi => {
  const call = <T,>(name: string) => async (data: object) => (await httpsCallable<object, T>(fns, name)(data)).data;
  return {
    enroll: (sectionId, studentId) => call<'enrolled' | 'waitlisted'>('enroll')({ sectionId, studentId }),
    drop: (sectionId, studentId) => call<void>('drop')({ sectionId, studentId }),
    rsvp: (eventId, status) => call<'going' | 'waitlist' | 'maybe'>('rsvp')({ eventId, status }),
    cancelRsvp: eventId => call<void>('cancelRsvp')({ eventId }),
  };
};

type Key = keyof DB;
/** DB key -> Firestore collection. */
const COLL: Record<Key, string> = {
  people: 'users', departments: 'departments', programs: 'programs', courses: 'courses', sections: 'sections', enrollments: 'enrollments',
  assignments: 'assignments', submissions: 'submissions', attendance: 'attendance', clubs: 'clubs', memberships: 'memberships',
  joinRequests: 'joinRequests', events: 'events', rsvps: 'rsvps', announcements: 'announcements', officeHours: 'officeHours',
  roleRequests: 'roleRequests', notices: 'notices', audit: 'audit', places: 'places',
};
const KEYS = Object.keys(COLL) as Key[];
/** Collections everyone signed in may read. */
const PUBLIC: Key[] = ['departments', 'programs', 'courses', 'sections', 'enrollments', 'assignments', 'clubs', 'memberships', 'joinRequests', 'events', 'rsvps', 'announcements', 'officeHours', 'places'];

type Op = { kind: 'set'; path: [string, string]; data: any } | { kind: 'del'; path: [string, string] };
const clean = (o: any) => JSON.parse(JSON.stringify(o)); // Firestore rejects `undefined`
/** Memberships and RSVPs use deterministic ids so security rules can look them up. */
const docId = (key: Key, o: any): string =>
  key === 'memberships' ? `${o.clubId}_${o.personId}` : key === 'rsvps' ? `${o.eventId}_${o.personId}` : o.id;

export async function ensureUser(fs: Firestore, u: { uid: string; displayName: string | null; email: string | null }) {
  const ref = doc(fs, 'users', u.uid);
  if ((await getDoc(ref)).exists()) return;
  const base: Person = { id: u.uid, name: u.displayName || (u.email ?? 'New student').split('@')[0], email: u.email ?? '', role: 'student', karma: 0 };
  if (u.email && u.email === BOOTSTRAP_ADMIN_EMAIL) {
    try { await setDoc(ref, clean({ ...base, role: 'admin' })); return; } catch { /* not a verified bootstrap account: fall back to student */ }
  }
  await setDoc(ref, clean(base));
}

export class FirebaseStore extends DemoStore {
  readonly kind = 'firebase' as any;
  ready: Promise<void>;
  onError?: (m: string) => void;
  private unsubs: Unsubscribe[] = []; private privUnsubs: Unsubscribe[] = [];
  private privRole: string | null = null; private chain: Promise<void> = Promise.resolve();
  private grades = new Map<string, string>(); private rawEnrollments: Enrollment[] = [];

  constructor(uid: string, private fs: Firestore, api: ServerApi) {
    super(uid, { ...EMPTY_DB });
    // Seat counts and waitlist order must be decided on the server, in a transaction. Everything else stays client-side.
    // The server writes the result to Firestore; our snapshot listeners pick it up, so there is no local state to patch.
    this.actions = {
      ...this.actions,
      enroll: async (sectionId, studentId) => api.enroll(sectionId, studentId),
      drop: async (sectionId, studentId) => { await api.drop(sectionId, studentId); },
      rsvp: async (eventId, status) => api.rsvp(eventId, status),
      cancelRsvp: async eventId => { await api.cancelRsvp(eventId); },
    };
    let pending = 0; let resolve!: () => void; this.ready = new Promise(r => (resolve = r));
    const track = () => { pending++; let done = false; return () => { if (!done) { done = true; if (--pending === 0) resolve(); } }; };
    const listen = (q: Query, onDocs: (docs: any[]) => void, label: string) => {
      const done = track();
      return onSnapshot(q, snap => { onDocs(snap.docs.map(d => ({ ...d.data(), id: (d.data() as any).id ?? d.id }))); done(); },
        err => { console.warn(`Firestore listen failed for ${label}:`, err.code); done(); });
    };
    const put = (key: Key) => (docs: any[]) => { this.db = { ...this.db, [key]: docs }; this.subs.forEach(s => s()); };

    for (const k of PUBLIC) {
      if (k === 'enrollments') this.unsubs.push(listen(collection(fs, COLL[k]), docs => { this.rawEnrollments = docs; this.mergeGrades(); }, k));
      else this.unsubs.push(listen(collection(fs, COLL[k]), put(k), k));
    }
    this.unsubs.push(listen(collection(fs, 'users'), docs => {
      put('people')(docs);
      const role = docs.find(p => p.id === uid)?.role ?? 'student';
      if (role !== this.privRole) this.subscribePrivate(role, uid, listen);
    }, 'people'));
    // Own notifications: rules only allow reading your own, so the query must be filtered.
    this.unsubs.push(listen(query(collection(fs, 'notices'), where('personId', '==', uid)), put('notices'), 'notices'));
  }

  /** Private data is queried per role because security rules are not filters. */
  private subscribePrivate(role: string, uid: string, listen: (q: Query, cb: (d: any[]) => void, l: string) => Unsubscribe) {
    this.privUnsubs.forEach(u => u()); this.privUnsubs = []; this.privRole = role; const fs = this.fs;
    const scoped = (name: string): Query | null => role === 'admin' ? collection(fs, name)
      : role === 'student' ? query(collection(fs, name), where('studentId', '==', uid))
      : role === 'faculty' || role === 'dept_head' ? query(collection(fs, name), where('instructorId', '==', uid)) : null;
    for (const [k, name] of [['attendance', 'attendance'], ['submissions', 'submissions']] as const) {
      const q = scoped(name); if (q) this.privUnsubs.push(listen(q, d => { this.db = { ...this.db, [k]: d }; this.subs.forEach(s => s()); }, k));
    }
    const g = scoped('grades'); if (g) this.privUnsubs.push(listen(g, d => { this.grades = new Map(d.map(x => [x.enrollmentId, x.grade])); this.mergeGrades(); }, 'grades'));
    this.privUnsubs.push(listen(role === 'admin' ? collection(fs, 'roleRequests') : query(collection(fs, 'roleRequests'), where('personId', '==', uid)),
      d => { this.db = { ...this.db, roleRequests: d }; this.subs.forEach(s => s()); }, 'roleRequests'));
    if (role === 'admin') this.privUnsubs.push(listen(collection(fs, 'audit'), d => { this.db = { ...this.db, audit: d.sort((a, b) => b.at.localeCompare(a.at)) }; this.subs.forEach(s => s()); }, 'audit'));
  }
  private mergeGrades() {
    this.db = { ...this.db, enrollments: this.rawEnrollments.map(e => (this.grades.has(e.id) ? { ...e, grade: this.grades.get(e.id) } : e)) };
    this.subs.forEach(s => s());
  }

  dispose() { [...this.unsubs, ...this.privUnsubs].forEach(u => u()); this.unsubs = []; this.privUnsubs = []; }
  reset() { /* never reset real data */ }

  /** Turn the difference between two DB snapshots into Firestore writes. */
  protected persist(prev: DB, next: DB) { this.enqueue(this.diff(prev, next)); }

  private diff(prev: DB, next: DB): Op[] {
    const ops: Op[] = [];
    const sectionOf = (id: string) => next.sections.find(s => s.id === id);
    const instructorForAssignment = (aid: string) => sectionOf(next.assignments.find(a => a.id === aid)?.sectionId ?? '')?.instructorId;
    for (const key of KEYS) {
      const a = prev[key] as any[], b = next[key] as any[]; if (a === b) continue;
      const before = new Map(a.map(x => [x.id, x]));
      const after = new Set<string>();
      for (const o of b) {
        after.add(o.id); const old = before.get(o.id); if (old === o) continue;
        if (key === 'notices' && !old) continue; // created by Cloud Functions, never by clients
        let data: any = o; const c = COLL[key];
        if (key === 'enrollments') {
          const { grade, ...rest } = o as Enrollment; data = rest;
          const { grade: oldGrade, ...oldRest } = (old ?? {}) as Enrollment;
          if (grade !== oldGrade) {
            if (grade) ops.push({ kind: 'set', path: ['grades', o.id], data: clean({ enrollmentId: o.id, studentId: o.studentId, sectionId: o.sectionId, instructorId: sectionOf(o.sectionId)?.instructorId, grade }) });
            else ops.push({ kind: 'del', path: ['grades', o.id] });
          }
        } else if (key === 'attendance') data = { ...o, instructorId: sectionOf(o.sectionId)?.instructorId };
        else if (key === 'submissions') data = { ...o, instructorId: instructorForAssignment(o.assignmentId) };
        // A grade change must not rewrite the enrollment doc itself (instructors may not edit enrollments).
        if (key === 'enrollments' && old && JSON.stringify(data) === JSON.stringify((({ grade, ...r }) => r)(old as Enrollment))) continue;
        ops.push({ kind: 'set', path: [c, docId(key, o)], data: clean(data) });
      }
      if (key === 'audit') continue; // the audit log is append-only; the demo trims it locally
      for (const o of a) if (!after.has(o.id)) {
        ops.push({ kind: 'del', path: [COLL[key], docId(key, o)] });
        if (key === 'enrollments') ops.push({ kind: 'del', path: ['grades', o.id] });
      }
    }
    return ops;
  }

  private enqueue(ops: Op[]) {
    if (!ops.length) return;
    this.chain = this.chain.then(async () => {
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(this.fs);
        for (const op of ops.slice(i, i + 400)) { const ref = doc(this.fs, op.path[0], op.path[1]); op.kind === 'set' ? batch.set(ref, op.data) : batch.delete(ref); }
        await batch.commit();
      }
    }).catch(err => {
      console.error('Firestore write failed', err);
      this.onError?.(err?.code === 'permission-denied' ? "You don't have permission to do that, so the change was not saved." : 'Could not save your change. Check your connection and try again.');
    });
  }

  /** Resolves when all queued writes have been committed (or failed). */
  flush() { return this.chain; }

  async importSample() {
    if (this.db.departments.length) throw new Error('This campus already has data');
    const seed = buildSeed();
    // Fake sample people must not collide with the real admin's account; keep the real person docs.
    const real = new Set(this.db.people.map(p => p.id));
    seed.people = seed.people.filter(p => !real.has(p.id));
    seed.notices = []; seed.audit = [];
    this.enqueue(this.diff({ ...EMPTY_DB }, seed));
    await this.chain;
  }
}
