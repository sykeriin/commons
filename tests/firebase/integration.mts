// Runs the real FirebaseStore against the Firestore emulator with the real firestore.rules, as each role.
// Usage: npm run test:firebase
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { createRequire } from 'node:module';
import { FirebaseStore, ensureUser, type ServerApi } from '../../src/data/firebaseStore';

// Stand-in for the Cloud Functions transport: call the real server handlers with the Admin SDK (bypasses rules, as in production).
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const adminDb = require('firebase-admin/firestore').getFirestore(require('firebase-admin/app').initializeApp({ projectId: 'demo-commons' }, 'server'));
const hm: any = await import('../../functions/src/handlers'); const H = hm.default ?? hm;
const apiFor = (uid: string): ServerApi => ({
  enroll: async (sectionId, studentId) => H.enroll(adminDb, await H.callerOf(adminDb, uid), { sectionId, studentId }),
  drop: async (sectionId, studentId) => H.drop(adminDb, await H.callerOf(adminDb, uid), { sectionId, studentId }),
  rsvp: async (eventId, status) => H.rsvp(adminDb, await H.callerOf(adminDb, uid), { eventId, status }),
  cancelRsvp: async eventId => H.cancelRsvp(adminDb, await H.callerOf(adminDb, uid), { eventId }),
});

const env = await initializeTestEnvironment({ projectId: 'demo-commons', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
const ctxFor = (uid: string, email = `${uid}@commons.edu`) => env.authenticatedContext(uid, { email, email_verified: true }).firestore() as any;
const errors: string[] = []; let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra = '') => { ok ? pass++ : (fail++, console.log('FAIL', name, extra)); };
const open = async (uid: string, email?: string) => { const fs = ctxFor(uid, email); const s = new FirebaseStore(uid, fs, apiFor(uid)); s.onError = m => errors.push(`${uid}: ${m}`); await s.ready; await new Promise(r => setTimeout(r, 400)); return { s, fs }; };
const count = async (fs: any, c: string) => (await getDocs(collection(fs, c))).size;

// 1. Bootstrap admin signs in for the first time, imports sample campus.
const adminFs = ctxFor('boss', 'durva.s170@gmail.com');
await ensureUser(adminFs, { uid: 'boss', displayName: 'Boss', email: 'durva.s170@gmail.com' });
check('bootstrap admin created with role admin', (await getDoc(doc(adminFs, 'users/boss'))).data()?.role === 'admin');
const admin = await open('boss', 'durva.s170@gmail.com');
await admin.s.importSample!(); await new Promise(r => setTimeout(r, 800));
const n = { users: await count(adminFs, 'users'), enrollments: await count(adminFs, 'enrollments'), grades: await count(adminFs, 'grades'), attendance: await count(adminFs, 'attendance'), memberships: await count(adminFs, 'memberships'), events: await count(adminFs, 'events') };
console.log('imported', JSON.stringify(n));
check('import wrote data', n.users > 50 && n.enrollments > 100 && n.grades > 100 && n.attendance > 500 && n.events === 14);
check('import raised no permission errors', errors.length === 0, errors.join(' | '));

// 2. Student (existing sample account s-demo): reads own private data, acts.
const stu = await open('s-demo'); const st = stu.s.getState();
check('student sees departments', st.departments.length === 6);
check('student sees own grades merged', st.enrollments.some(e => e.studentId === 's-demo' && !!e.grade));
check('student does NOT see classmates grades', st.enrollments.filter(e => e.studentId !== 's-demo').every(e => !e.grade));
check('student sees only own attendance', st.attendance.length > 0 && st.attendance.every(a => a.studentId === 's-demo'));
const A = stu.s.actions;
check('enroll works', (await A.enroll('sec-bio240', 's-demo')) === 'enrolled'); await stu.s.flush();
await new Promise(r => setTimeout(r, 500));
check('enrolment reaches the store through the server + snapshot (no local patching)', stu.s.getState().enrollments.some(e => e.studentId === 's-demo' && e.sectionId === 'sec-bio240' && e.status === 'enrolled'));
check('enrolment persisted', (await getDoc(doc(adminFs, 'enrollments/en-s-demo-sec-bio240'))).exists() || (await getDocs(collection(adminFs, 'enrollments'))).docs.some(d => d.data().sectionId === 'sec-bio240' && d.data().studentId === 's-demo'));
await A.rsvp('ev-1', 'going'); await A.joinClub('chess'); await A.submitAssignment('as-sec-cs220-3', 's-demo');
const clubId = await A.createClub({ name: 'Origami Order', description: 'Folding', category: 'Arts', color: '#c2185b', joinPolicy: 'open' });
await A.requestRole('s-demo', 'faculty', 'I teach'); await A.requestJoin('hoops', 'pick me'); await A.markNoticesRead(); await stu.s.flush();
check('student actions raised no permission errors', errors.length === 0, errors.join(' | '));
check('new club stored as pending', (await getDoc(doc(adminFs, `clubs/${clubId}`))).data()?.approval === 'pending');
check('rsvp doc has deterministic id', (await getDoc(doc(adminFs, 'rsvps/ev-1_s-demo'))).exists());
await A.cancelRsvp('ev-1'); await new Promise(r => setTimeout(r, 400));
check('cancelRsvp removes the doc via the server', !(await getDoc(doc(adminFs, 'rsvps/ev-1_s-demo'))).exists());
await A.rsvp('ev-1', 'going'); await stu.s.flush();
let threw = false; try { await A.decideClub(clubId, 'approved'); } catch { threw = true; } check('student cannot approve own club (store guard)', threw);

let tDept = false; try { await A.createEvent({ title: 'x', description: 'x', category: 'Social', date: '2026-12-01', start: '10:00', end: '11:00', placeId: 'quad', scope: 'department', departmentId: 'cs' }); } catch { tDept = true; }
check('student cannot host department event (store guard)', tDept);

// 3. Faculty acts on their own section.
const fac = await open('f-ravi'); const FA = fac.s.actions; const fst = fac.s.getState();
check('faculty sees own roster attendance', fst.attendance.length > 0 && fst.attendance.every(a => (fst.sections.find(s => s.id === a.sectionId)?.instructorId) === 'f-ravi'));
const roster = fst.enrollments.filter(e => e.sectionId === 'sec-cs340' && e.status === 'enrolled');
await FA.saveAttendance('sec-cs340', '2026-11-02', roster.map(r => ({ studentId: r.studentId, status: 'present' as const })));
await FA.setGrade(roster[0].id, 'A'); await FA.createAssignment({ sectionId: 'sec-cs340', title: 'Lab 9', description: '', dueAt: '2026-12-01', points: 20 });
await FA.postAnnouncement({ title: 'Hello', body: 'class', scope: 'course', scopeId: 'sec-cs340' }); await FA.addOfficeHour({ day: 3, start: '10:00', end: '11:00', placeId: 'turing-101' }); await fac.s.flush();
check('faculty actions raised no permission errors', errors.length === 0, errors.join(' | '));
check('grade doc written with instructorId', (await getDoc(doc(adminFs, `grades/${roster[0].id}`))).data()?.instructorId === 'f-ravi');
const f2 = await open('f-ada'); let t2 = false; try { await f2.s.actions.setGrade(roster[0].id, 'F'); } catch { t2 = true; }
check('other faculty cannot grade (store guard)', t2);

// 4. Staff approves; admin decides role + changes role.
const staff = await open('staff-jo'); await staff.s.actions.decideClub('quidditch', 'approved'); await staff.s.actions.decideEvent('ev-12', 'approved'); await staff.s.flush();
check('staff approvals raised no permission errors', errors.length === 0, errors.join(' | '));
check('client did not write a notice for the club president (server triggers do that)', (await adminDb.collection('notices').get()).docs.every((d: any) => !d.id.startsWith('n-')));
check('club approved in Firestore', (await getDoc(doc(adminFs, 'clubs/quidditch'))).data()?.approval === 'approved');
const adm = await open('boss', 'durva.s170@gmail.com'); const rr = adm.s.getState().roleRequests.find(r => r.personId === 's-demo')!;
await adm.s.actions.decideRole(rr.id, 'approved'); await adm.s.actions.setPersonRole('s-3', 'staff'); await adm.s.actions.saveDepartment({ name: 'Law', code: 'LAW' }); await adm.s.flush();
check('admin actions raised no permission errors', errors.length === 0, errors.join(' | '));
check('role really changed server-side', (await getDoc(doc(adminFs, 'users/s-demo'))).data()?.role === 'faculty');

// 5. dept head adds a course in own dept; audit is admin-only readable.
const head = await open('f-ada'); await head.s.actions.createCourse({ code: 'CS450', title: 'Compilers', departmentId: 'cs', credits: 3, description: 'x' }); await head.s.flush();
check('dept head course creation raised no errors', errors.length === 0, errors.join(' | '));
check('admin sees audit log, student does not', adm.s.getState().audit.length > 0 && stu.s.getState().audit.length === 0);
console.log(`\n${pass} passed, ${fail} failed`); if (errors.length) console.log('Write errors:\n' + errors.join('\n'));
await env.cleanup(); process.exit(fail ? 1 : 0);
