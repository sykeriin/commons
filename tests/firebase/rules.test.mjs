// Security-rules unit tests. Usage: npm run test:rules
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where, writeBatch } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-commons', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
const U = (id, role, extra = {}) => ({ id, name: id, email: `${id}@x.edu`, role, karma: 0, ...extra });
await env.withSecurityRulesDisabled(async ctx => {
  const d = ctx.firestore(); const S = (p, v) => setDoc(doc(d, p), v);
  await Promise.all([
    S('users/s1', U('s1', 'student')), S('users/s2', U('s2', 'student')), S('users/s3', U('s3', 'student')), S('users/f1', U('f1', 'faculty', { departmentId: 'cs' })), S('users/f2', U('f2', 'faculty', { departmentId: 'cs' })),
    S('users/head1', U('head1', 'dept_head', { departmentId: 'cs' })), S('users/staff1', U('staff1', 'staff')), S('users/admin1', U('admin1', 'admin')),
    S('courses/c1', { id: 'c1', departmentId: 'cs' }), S('sections/sec1', { id: 'sec1', courseId: 'c1', instructorId: 'f1' }), S('assignments/a1', { id: 'a1', sectionId: 'sec1' }),
    S('grades/g-s1', { studentId: 's1', sectionId: 'sec1', instructorId: 'f1', grade: 'A' }), S('grades/g-s2', { studentId: 's2', sectionId: 'sec1', instructorId: 'f1', grade: 'B' }),
    S('clubs/club1', { id: 'club1', name: 'Open', approval: 'approved', joinPolicy: 'open', presidentId: 's1', memberCount: 1 }),
    S('clubs/club2', { id: 'club2', name: 'Closed', approval: 'approved', joinPolicy: 'request', presidentId: 's3', memberCount: 1 }),
    S('memberships/club1_s1', { id: 'm1', clubId: 'club1', personId: 's1', role: 'president' }), S('memberships/club1_s3', { id: 'm3', clubId: 'club1', personId: 's3', role: 'officer' }),
    S('events/ev1', { id: 'ev1', scope: 'club', clubId: 'club1', organizerId: 's1', approval: 'approved' }),
    S('clubs/club3', { id: 'club3', name: 'Pending', approval: 'pending', presidentId: 's3', memberCount: 1 }),
    S('events/ev3', { id: 'ev3', scope: 'campus', organizerId: 's2', approval: 'pending' }),
    S('events/ev2', { id: 'ev2', scope: 'campus', organizerId: 's2', approval: 'pending' }),
    S('rsvps/ev1_s2', { id: 'r', eventId: 'ev1', personId: 's2', status: 'going', checkedIn: false }),
    S('rsvps/ev1_s3', { id: 'r3', eventId: 'ev1', personId: 's3', status: 'waitlist', checkedIn: false }),
    S('notices/n1', { id: 'n1', personId: 's2', title: 't', body: 'b', read: false }),
    S('officeHours/oh1', { id: 'oh1', facultyId: 'f1', day: 2, booked: [] }),
    S('roleRequests/rr1', { id: 'rr1', personId: 's1', requested: 'faculty', status: 'pending' }),
  ]);
});

const as = (uid, claims = {}) => env.authenticatedContext(uid, { email: `${uid}@x.edu`, email_verified: true, ...claims }).firestore();
let pass = 0, fail = 0; const bad = [];
const t = async (name, expectOk, fn) => {
  try { await (expectOk ? assertSucceeds(fn()) : assertFails(fn())); pass++; } catch (e) { fail++; bad.push(`${expectOk ? 'SHOULD ALLOW' : 'SHOULD DENY'}: ${name}\n   ${String(e.message).split('\n')[0]}`); }
};
const D = (db, p) => doc(db, p);

// --- users & roles
await t('student edits own bio', true, () => updateDoc(D(as('s1'), 'users/s1'), { bio: 'hi' }));
await t('student escalates self to admin', false, () => updateDoc(D(as('s1'), 'users/s1'), { role: 'admin' }));
await t('student changes own karma', false, () => updateDoc(D(as('s1'), 'users/s1'), { karma: 999 }));
await t('student edits someone else', false, () => updateDoc(D(as('s1'), 'users/s2'), { bio: 'x' }));
await t('new user creates self as student', true, () => setDoc(D(as('s9'), 'users/s9'), U('s9', 'student')));
await t('new user creates self as admin', false, () => setDoc(D(as('s8'), 'users/s8'), U('s8', 'admin')));
await t('bootstrap admin (verified email) creates self as admin', true, () => setDoc(D(as('boss', { email: 'durva.s170@gmail.com' }), 'users/boss'), U('boss', 'admin', { email: 'durva.s170@gmail.com' })));
await t('same email UNverified cannot bootstrap', false, () => setDoc(D(as('boss2', { email: 'durva.s170@gmail.com', email_verified: false }), 'users/boss2'), U('boss2', 'admin', { email: 'durva.s170@gmail.com' })));
await t('admin changes a role', true, () => updateDoc(D(as('admin1'), 'users/s2'), { role: 'faculty' }));
await t('staff changes a role', false, () => updateDoc(D(as('staff1'), 'users/s3'), { role: 'faculty' }));
await t('faculty moves self to another department', false, () => updateDoc(D(as('f1'), 'users/f1'), { departmentId: 'bus' }));
await t('anonymous reads users', false, () => getDoc(D(env.unauthenticatedContext().firestore(), 'users/s1')));
// --- grades / attendance / submissions
await t('instructor grades own section', true, () => setDoc(D(as('f1'), 'grades/g-new'), { studentId: 's3', sectionId: 'sec1', instructorId: 'f1', grade: 'B' }));
await t('other faculty grades someone else\'s section', false, () => setDoc(D(as('f2'), 'grades/g-x'), { studentId: 's3', sectionId: 'sec1', instructorId: 'f2', grade: 'A' }));
await t('other faculty forges instructorId', false, () => setDoc(D(as('f2'), 'grades/g-y'), { studentId: 's3', sectionId: 'sec1', instructorId: 'f1', grade: 'A' }));
await t('student writes own grade', false, () => setDoc(D(as('s1'), 'grades/g-s1'), { studentId: 's1', sectionId: 'sec1', instructorId: 'f1', grade: 'A+' }));
await t('student reads own grade', true, () => getDoc(D(as('s1'), 'grades/g-s1')));
await t('student reads classmate grade', false, () => getDoc(D(as('s1'), 'grades/g-s2')));
await t('student query of own grades', true, () => getDocs(query(collection(as('s1'), 'grades'), where('studentId', '==', 's1'))));
await t('student unfiltered grades query', false, () => getDocs(collection(as('s1'), 'grades')));
await t('instructor query of own grades', true, () => getDocs(query(collection(as('f1'), 'grades'), where('instructorId', '==', 'f1'))));
await t('staff reads grades', false, () => getDoc(D(as('staff1'), 'grades/g-s1')));
await t('instructor takes attendance', true, () => setDoc(D(as('f1'), 'attendance/a-1'), { studentId: 's1', sectionId: 'sec1', instructorId: 'f1', status: 'present' }));
await t('student marks own attendance', false, () => setDoc(D(as('s1'), 'attendance/a-2'), { studentId: 's1', sectionId: 'sec1', instructorId: 'f1', status: 'present' }));
await t('student submits assignment', true, () => setDoc(D(as('s1'), 'submissions/su1'), { assignmentId: 'a1', studentId: 's1', instructorId: 'f1', submittedAt: 'now' }));
await t('student submits with a self-given score', false, () => setDoc(D(as('s1'), 'submissions/su2'), { assignmentId: 'a1', studentId: 's1', instructorId: 'f1', score: 50 }));
await t('student submits pointing at wrong instructor', false, () => setDoc(D(as('s1'), 'submissions/su3'), { assignmentId: 'a1', studentId: 's1', instructorId: 'f2' }));
await t('instructor scores submission', true, () => setDoc(D(as('f1'), 'submissions/su1'), { assignmentId: 'a1', studentId: 's1', instructorId: 'f1', score: 40 }));
await t('student enrols self directly (must go through Cloud Functions)', false, () => setDoc(D(as('s1'), 'enrollments/e1'), { id: 'e1', studentId: 's1', sectionId: 'sec1', status: 'enrolled' }));
await t('student enrols someone else', false, () => setDoc(D(as('s1'), 'enrollments/e2'), { id: 'e2', studentId: 's2', sectionId: 'sec1', status: 'enrolled' }));
// --- courses
await t('dept head adds course in own dept', true, () => setDoc(D(as('head1'), 'courses/c2'), { id: 'c2', departmentId: 'cs' }));
await t('dept head adds course in other dept', false, () => setDoc(D(as('head1'), 'courses/c3'), { id: 'c3', departmentId: 'bus' }));
await t('student adds course', false, () => setDoc(D(as('s1'), 'courses/c4'), { id: 'c4', departmentId: 'cs' }));
// --- clubs
await t('student creates pending club + own presidency (batch)', true, async () => { const d = as('s4'); const b = writeBatch(d); b.set(D(d, 'clubs/club9'), { id: 'club9', presidentId: 's4', approval: 'pending', memberCount: 1 }); b.set(D(d, 'memberships/club9_s4'), { id: 'm9', clubId: 'club9', personId: 's4', role: 'president' }); return b.commit(); });
await t('student creates pre-approved club', false, () => setDoc(D(as('s4'), 'clubs/club8'), { id: 'club8', presidentId: 's4', approval: 'approved', memberCount: 1 }));
await t('student claims presidency of club they do not own', false, async () => { const d = as('s4'); return setDoc(D(d, 'memberships/club1_s4'), { id: 'mx', clubId: 'club1', personId: 's4', role: 'president' }); });
await t('student approves pending club', false, () => updateDoc(D(as('s2'), 'clubs/club3'), { approval: 'approved' }));
await t('president cannot self-approve own pending club', false, () => updateDoc(D(as('s3'), 'clubs/club3'), { approval: 'approved' }));
await t('staff approves club', true, () => updateDoc(D(as('staff1'), 'clubs/club3'), { approval: 'approved' }));
await t('member bumps memberCount only', true, () => updateDoc(D(as('s2'), 'clubs/club1'), { memberCount: 2 }));
await t('member renames club', false, () => updateDoc(D(as('s2'), 'clubs/club1'), { name: 'Hacked' }));
await t('student joins open club', true, () => setDoc(D(as('s2'), 'memberships/club1_s2'), { id: 'm2', clubId: 'club1', personId: 's2', role: 'member' }));
await t('student joins request-only club directly', false, () => setDoc(D(as('s2'), 'memberships/club2_s2'), { id: 'm2b', clubId: 'club2', personId: 's2', role: 'member' }));
await t('student joins as officer', false, () => setDoc(D(as('s2'), 'memberships/club1_s2'), { id: 'm2', clubId: 'club1', personId: 's2', role: 'officer' }));
await t('officer adds an approved member (join request)', true, () => setDoc(D(as('s3'), 'memberships/club1_s5'), { id: 'm5', clubId: 'club1', personId: 's5', role: 'member' }));
await t('president promotes member', true, () => updateDoc(D(as('s1'), 'memberships/club1_s3'), { role: 'member' }));
await t('officer promotes self', false, async () => { await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'memberships/club1_s3'), { id: 'm3', clubId: 'club1', personId: 's3', role: 'officer' })); return updateDoc(D(as('s3'), 'memberships/club1_s3'), { role: 'president' }); });
await t('member leaves club', true, () => deleteDoc(D(as('s2'), 'memberships/club1_s2')));
await t('student creates join request for self', true, () => setDoc(D(as('s2'), 'joinRequests/j1'), { id: 'j1', clubId: 'club2', personId: 's2', status: 'pending' }));
await t('student forges join request for someone else', false, () => setDoc(D(as('s2'), 'joinRequests/j2'), { id: 'j2', clubId: 'club2', personId: 's1', status: 'pending' }));
// --- events
await t('club president creates club event', true, () => setDoc(D(as('s1'), 'events/e10'), { id: 'e10', scope: 'club', clubId: 'club1', organizerId: 's1', approval: 'approved' }));
await t('non-member creates club event', false, () => setDoc(D(as('s5'), 'events/e11'), { id: 'e11', scope: 'club', clubId: 'club1', organizerId: 's5', approval: 'approved' }));
await t('student creates department event', false, () => setDoc(D(as('s5'), 'events/e14'), { id: 'e14', scope: 'department', departmentId: 'cs', organizerId: 's5', approval: 'approved' }));
await t('faculty creates department event', true, () => setDoc(D(as('f1'), 'events/e15'), { id: 'e15', scope: 'department', departmentId: 'cs', organizerId: 'f1', approval: 'approved' }));
await t('student creates campus event pending', true, () => setDoc(D(as('s5'), 'events/e12'), { id: 'e12', scope: 'campus', organizerId: 's5', approval: 'pending' }));
await t('student creates campus event pre-approved', false, () => setDoc(D(as('s5'), 'events/e13'), { id: 'e13', scope: 'campus', organizerId: 's5', approval: 'approved' }));
await t('organizer self-approves campus event', false, () => updateDoc(D(as('s2'), 'events/ev3'), { approval: 'approved' }));
await t('staff approves event', true, () => updateDoc(D(as('staff1'), 'events/ev3'), { approval: 'approved' }));
await t('club officer deletes club event', true, () => deleteDoc(D(as('s3'), 'events/e10')));
await t('random student deletes event', false, () => deleteDoc(D(as('s5'), 'events/ev2')));
await t('student rsvps directly (must go through Cloud Functions)', false, () => setDoc(D(as('s5'), 'rsvps/ev1_s5'), { id: 'r5', eventId: 'ev1', personId: 's5', status: 'going', checkedIn: false }));
await t('student rsvps already checked-in', false, () => setDoc(D(as('s5'), 'rsvps/ev1_s5'), { id: 'r5', eventId: 'ev1', personId: 's5', status: 'going', checkedIn: true }));
await t('student rsvps for someone else', false, () => setDoc(D(as('s5'), 'rsvps/ev1_s6'), { id: 'r6', eventId: 'ev1', personId: 's6', status: 'going', checkedIn: false }));
await t('attendee checks self in', false, () => updateDoc(D(as('s2'), 'rsvps/ev1_s2'), { checkedIn: true }));
await t('organizer checks attendee in', true, () => updateDoc(D(as('s1'), 'rsvps/ev1_s2'), { checkedIn: true }));
await t('waitlisted promoted by someone cancelling directly (must go through Cloud Functions)', false, () => updateDoc(D(as('s2'), 'rsvps/ev1_s3'), { status: 'going' }));
await t('stranger edits others rsvp other fields', false, () => updateDoc(D(as('s5'), 'rsvps/ev1_s2'), { status: 'maybe' }));
await t('admin enrols a student', true, () => setDoc(D(as('admin1'), 'enrollments/e3'), { id: 'e3', studentId: 's3', sectionId: 'sec1', status: 'enrolled' }));
await t('student drops via direct delete', false, () => deleteDoc(D(as('s1'), 'enrollments/e1')));
await t('student cancels rsvp via direct delete', false, () => deleteDoc(D(as('s2'), 'rsvps/ev1_s2')));
await t('admin creates notice (sample import)', true, () => setDoc(D(as('admin1'), 'notices/n9'), { id: 'n9', personId: 's2', title: 't', body: 'b', read: false }));
await t('owner registers a push token', true, () => setDoc(D(as('s1'), 'users/s1/devices/tok1'), { token: 'tok1', platform: 'android' }));
await t('other user registers a token on someone else', false, () => setDoc(D(as('s2'), 'users/s1/devices/tok2'), { token: 'tok2' }));
await t('other user reads someone elses tokens', false, () => getDocs(collection(as('s2'), 'users/s1/devices')));
await t('organizer changes rsvp status (not just check-in)', false, () => updateDoc(D(as('s1'), 'rsvps/ev1_s3'), { status: 'going' }));
// --- announcements
await t('student posts campus announcement', false, () => setDoc(D(as('s1'), 'announcements/an1'), { id: 'an1', authorId: 's1', scope: 'campus' }));
await t('staff posts campus announcement', true, () => setDoc(D(as('staff1'), 'announcements/an2'), { id: 'an2', authorId: 'staff1', scope: 'campus' }));
await t('instructor posts to own course', true, () => setDoc(D(as('f1'), 'announcements/an3'), { id: 'an3', authorId: 'f1', scope: 'course', scopeId: 'sec1' }));
await t('other faculty posts to course', false, () => setDoc(D(as('f2'), 'announcements/an4'), { id: 'an4', authorId: 'f2', scope: 'course', scopeId: 'sec1' }));
await t('dept head posts to own dept', true, () => setDoc(D(as('head1'), 'announcements/an5'), { id: 'an5', authorId: 'head1', scope: 'department', scopeId: 'cs' }));
await t('dept head posts to other dept', false, () => setDoc(D(as('head1'), 'announcements/an6'), { id: 'an6', authorId: 'head1', scope: 'department', scopeId: 'bus' }));
await t('club officer posts to club', true, () => setDoc(D(as('s1'), 'announcements/an7'), { id: 'an7', authorId: 's1', scope: 'club', scopeId: 'club1' }));
await t('authorship forgery', false, () => setDoc(D(as('staff1'), 'announcements/an8'), { id: 'an8', authorId: 'admin1', scope: 'campus' }));
// --- role requests / notices / audit / office hours
await t('student requests faculty', true, () => setDoc(D(as('s5'), 'roleRequests/rr9'), { id: 'rr9', personId: 's5', requested: 'faculty', status: 'pending' }));
await t('student requests admin', false, () => setDoc(D(as('s5'), 'roleRequests/rr8'), { id: 'rr8', personId: 's5', requested: 'admin', status: 'pending' }));
await t('student pre-approves own request', false, () => setDoc(D(as('s5'), 'roleRequests/rr7'), { id: 'rr7', personId: 's5', requested: 'faculty', status: 'approved' }));
await t('other student reads role request', false, () => getDoc(D(as('s2'), 'roleRequests/rr1')));
await t('own role-request query', true, () => getDocs(query(collection(as('s1'), 'roleRequests'), where('personId', '==', 's1'))));
await t('admin approves role request', true, () => updateDoc(D(as('admin1'), 'roleRequests/rr1'), { status: 'approved' }));
await t('student approves own request', false, () => updateDoc(D(as('s1'), 'roleRequests/rr1'), { status: 'approved' }));
await t('student sends notice to another user directly (must go through Cloud Functions)', false, () => setDoc(D(as('s1'), 'notices/n2'), { id: 'n2', personId: 's2', title: 'hi', body: 'x', read: false }));
await t('student reads own notice', true, () => getDoc(D(as('s2'), 'notices/n1')));
await t('student reads others notice', false, () => getDoc(D(as('s1'), 'notices/n1')));
await t('owner marks notice read', true, () => updateDoc(D(as('s2'), 'notices/n1'), { read: true }));
await t('owner rewrites notice text', false, () => updateDoc(D(as('s2'), 'notices/n1'), { title: 'changed' }));
await t('staff writes audit entry', true, () => setDoc(D(as('staff1'), 'audit/au1'), { id: 'au1', actorId: 'staff1', action: 'x' }));
await t('student writes audit entry', false, () => setDoc(D(as('s1'), 'audit/au2'), { id: 'au2', actorId: 's1', action: 'x' }));
await t('staff edits audit entry', false, () => updateDoc(D(as('staff1'), 'audit/au1'), { action: 'y' }));
await t('student reads audit', false, () => getDocs(collection(as('s1'), 'audit')));
await t('admin reads audit', true, () => getDocs(collection(as('admin1'), 'audit')));
await t('faculty adds office hour', true, () => setDoc(D(as('f1'), 'officeHours/oh2'), { id: 'oh2', facultyId: 'f1', day: 3, booked: [] }));
await t('student adds office hour', false, () => setDoc(D(as('s1'), 'officeHours/oh3'), { id: 'oh3', facultyId: 's1', day: 3, booked: [] }));
await t('student books office hour', true, () => updateDoc(D(as('s1'), 'officeHours/oh1'), { booked: ['s1'] }));
await t('student moves office hour', false, () => updateDoc(D(as('s1'), 'officeHours/oh1'), { day: 5 }));

console.log(`\n${pass} passed, ${fail} failed`); if (bad.length) console.log('\n' + bad.join('\n'));
await env.cleanup(); process.exit(fail ? 1 : 0);
