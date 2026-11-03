// CommonJS (no top-level await) to match the functions package. Seat/waitlist handlers, notice builders and push sender, run against the Firestore emulator (npm run test:functions).
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import assert from 'node:assert/strict';
import * as h from '../src/handlers';
import * as n from '../src/notices';
import { pushNotice, type Messenger } from '../src/push';

const db = getFirestore(initializeApp({ projectId: 'demo-commons' }));
let pass = 0, fail = 0;
const test = async (name: string, fn: () => Promise<void>) => { try { await fn(); pass++; } catch (e: any) { fail++; console.log('FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 4).join('\n    ')); } };
const student = (uid: string): h.Caller => ({ uid, role: 'student' });
const count = async (col: string, where: [string, string][]) => { let q: any = db.collection(col); for (const [k, v] of where) q = q.where(k, '==', v); return (await q.get()).size; };
const rejects = async (p: Promise<unknown>, code: string) => { try { await p; } catch (e: any) { assert.equal(e.code, code, e.message); return; } assert.fail(`expected ${code}`); };
const seedUsers = (ids: string[]) => Promise.all(ids.map(id => db.doc(`users/${id}`).set({ id, name: id, role: 'student' })));

async function main() {
// ---------------------------------------------------------------- enrolment
const N = 40, CAP = 10; const ids = Array.from({ length: N }, (_, i) => `u${i}`);
await seedUsers([...ids, 'boss']); await db.doc('users/boss').set({ id: 'boss', role: 'admin' });
await db.doc('sections/race').set({ id: 'race', capacity: CAP });

await test(`${N} simultaneous enrolments into ${CAP} seats: exactly ${CAP} enrolled`, async () => {
  const results = await Promise.all(ids.map(id => h.enroll(db, student(id), { sectionId: 'race' })));
  assert.equal(results.filter(r => r === 'enrolled').length, CAP);
  assert.equal(results.filter(r => r === 'waitlisted').length, N - CAP);
  assert.equal(await count('enrollments', [['sectionId', 'race'], ['status', 'enrolled']]), CAP);
  assert.equal(await count('enrollments', [['sectionId', 'race'], ['status', 'waitlisted']]), N - CAP);
});
await test('re-enrolling is idempotent (no duplicate, same status)', async () => {
  const before = await count('enrollments', [['sectionId', 'race']]);
  const r = await h.enroll(db, student('u0'), { sectionId: 'race' }); const r2 = await h.enroll(db, student('u0'), { sectionId: 'race' });
  assert.equal(r, r2); assert.equal(await count('enrollments', [['sectionId', 'race']]), before);
});
await test('dropping an enrolled student promotes exactly one: the earliest waitlisted', async () => {
  const snap = await db.collection('enrollments').where('sectionId', '==', 'race').get();
  const enrolled = snap.docs.filter(d => d.get('status') === 'enrolled')[0];
  const first = snap.docs.filter(d => d.get('status') === 'waitlisted').sort((a, b) => a.get('createdAt').localeCompare(b.get('createdAt')))[0];
  await h.drop(db, student(enrolled.get('studentId')), { sectionId: 'race' });
  assert.equal((await db.doc(enrolled.ref.path).get()).get('status'), 'dropped');
  assert.equal((await db.doc(first.ref.path).get()).get('status'), 'enrolled');
  assert.equal(await count('enrollments', [['sectionId', 'race'], ['status', 'enrolled']]), CAP);
  assert.equal(await count('enrollments', [['sectionId', 'race'], ['status', 'waitlisted']]), N - CAP - 1);
});
await test('dropping a waitlisted student promotes nobody', async () => {
  const w = (await db.collection('enrollments').where('sectionId', '==', 'race').where('status', '==', 'waitlisted').get()).docs[0];
  await h.drop(db, student(w.get('studentId')), { sectionId: 'race' });
  assert.equal(await count('enrollments', [['sectionId', 'race'], ['status', 'enrolled']]), CAP);
});
await test('a dropped student can re-enrol (goes to the back of the line if full)', async () => {
  const d = (await db.collection('enrollments').where('sectionId', '==', 'race').where('status', '==', 'dropped').get()).docs[0];
  assert.equal(await h.enroll(db, student(d.get('studentId')), { sectionId: 'race' }), 'waitlisted');
});
await test('cannot enrol someone else unless admin', async () => {
  await rejects(h.enroll(db, student('u1'), { sectionId: 'race', studentId: 'u2' }), 'permission-denied');
  await db.doc('sections/open').set({ id: 'open', capacity: 5 });
  assert.equal(await h.enroll(db, { uid: 'boss', role: 'admin' }, { sectionId: 'open', studentId: 'u2' }), 'enrolled');
});
await test('unknown section / missing arguments are rejected', async () => {
  await rejects(h.enroll(db, student('u1'), { sectionId: 'nope' }), 'not-found');
  await rejects(h.enroll(db, student('u1'), {}), 'invalid-argument');
});

// ---------------------------------------------------------------- RSVPs
const R = 25, RCAP = 5; const rids = Array.from({ length: R }, (_, i) => `r${i}`); await seedUsers(rids);
await db.doc('events/big').set({ id: 'big', approval: 'approved', capacity: RCAP });
await db.doc('events/draft').set({ id: 'draft', approval: 'pending', capacity: RCAP });
await db.doc('events/open').set({ id: 'open', approval: 'approved' });

await test(`${R} simultaneous RSVPs for ${RCAP} places: exactly ${RCAP} going`, async () => {
  const out = await Promise.all(rids.map(id => h.rsvp(db, student(id), { eventId: 'big', status: 'going' })));
  assert.equal(out.filter(x => x === 'going').length, RCAP); assert.equal(out.filter(x => x === 'waitlist').length, R - RCAP);
  assert.equal(await count('rsvps', [['eventId', 'big'], ['status', 'going']]), RCAP);
});
await test('cancelling a going RSVP promotes the earliest waitlisted person', async () => {
  const snap = await db.collection('rsvps').where('eventId', '==', 'big').get();
  const going = snap.docs.find(d => d.get('status') === 'going')!;
  const first = snap.docs.filter(d => d.get('status') === 'waitlist').sort((a, b) => a.get('createdAt').localeCompare(b.get('createdAt')))[0];
  await h.cancelRsvp(db, student(going.get('personId')), { eventId: 'big' });
  assert.equal((await going.ref.get()).exists, false);
  assert.equal((await first.ref.get()).get('status'), 'going');
  assert.equal(await count('rsvps', [['eventId', 'big'], ['status', 'going']]), RCAP);
});
await test('"maybe" does not use a place; going again while already going keeps the place', async () => {
  await h.rsvp(db, student('m1'), { eventId: 'big', status: 'maybe' });
  assert.equal(await count('rsvps', [['eventId', 'big'], ['status', 'going']]), RCAP);
  const g = (await db.collection('rsvps').where('eventId', '==', 'big').where('status', '==', 'going').get()).docs[0].get('personId');
  assert.equal(await h.rsvp(db, student(g), { eventId: 'big', status: 'going' }), 'going');
});
await test('events without a capacity are never full; unapproved events refuse RSVPs; bad status rejected', async () => {
  assert.equal(await h.rsvp(db, student('r1'), { eventId: 'open', status: 'going' }), 'going');
  await rejects(h.rsvp(db, student('r1'), { eventId: 'draft', status: 'going' }), 'failed-precondition');
  await rejects(h.rsvp(db, student('r1'), { eventId: 'open', status: 'waitlist' as any }), 'invalid-argument');
  await rejects(h.rsvp(db, student('r1'), { eventId: 'ghost', status: 'going' }), 'not-found');
});
await test('new RSVPs always start not checked in', async () => {
  assert.equal((await db.doc('rsvps/open_r1').get()).get('checkedIn'), false);
});

// ---------------------------------------------------------------- notice builders (pure)
await test('notice builders produce the right recipient, text and only on real changes', async () => {
  assert.equal(n.forGrade({ studentId: 's', sectionId: 'sec-cs340', grade: 'A' }, undefined)[0].personId, 's');
  assert.match(n.forGrade({ studentId: 's', sectionId: 'sec-cs340', grade: 'A' }, undefined)[0].body, /CS340 is A/);
  assert.equal(n.forGrade({ studentId: 's', grade: 'A' }, { grade: 'A' }).length, 0);
  assert.deepEqual(n.forAssignment({ title: 'Lab' }, ['a', 'b']).map(x => x.personId), ['a', 'b']);
  assert.equal(n.forJoinRequest({ clubId: 'c', personId: 'p', status: 'pending' }, undefined, 'Chess', 'pres')[0].personId, 'pres');
  assert.equal(n.forJoinRequest({ clubId: 'c', personId: 'p', status: 'approved' }, { status: 'pending' }, 'Chess', 'pres')[0].personId, 'p');
  assert.equal(n.forJoinRequest({ clubId: 'c', personId: 'p', status: 'pending' }, { status: 'pending' }, 'Chess', 'pres').length, 0);
  assert.equal(n.forClubDecision({ approval: 'approved', presidentId: 'x', name: 'N', id: 'i' }, { approval: 'pending' })[0].personId, 'x');
  assert.equal(n.forClubDecision({ approval: 'pending' }, { approval: 'pending' }).length, 0);
  assert.equal(n.forEventDecision({ approval: 'rejected', organizerId: 'o', title: 'T', id: 'e' }, { approval: 'pending' })[0].title, 'Event rejected');
  assert.equal(n.forRoleDecision({ status: 'approved', personId: 'p', requested: 'dept_head' }, { status: 'pending' })[0].body, 'Your request to become dept head was approved.');
  assert.equal(n.forSeatPromotion({ studentId: 's', status: 'enrolled' }, { status: 'waitlisted' }, 'enrollment', 'CS1').length, 1);
  assert.equal(n.forSeatPromotion({ studentId: 's', status: 'enrolled' }, { status: 'enrolled' }, 'enrollment', 'CS1').length, 0);
  assert.equal(n.forSeatPromotion({ personId: 'p', status: 'going' }, { status: 'waitlist' }, 'rsvp', 'Mixer')[0].body, 'A spot opened up for Mixer.');
});

// ---------------------------------------------------------------- push
const fake = (fail: Record<string, string> = {}): Messenger & { calls: any[] } => ({ calls: [] as any[], async sendEachForMulticast(m) { (this as any).calls.push(m); return { responses: m.tokens.map(t => (fail[t] ? { success: false, error: { code: fail[t] } } : { success: true })) }; } });
await test('push goes to every registered device with the link in data', async () => {
  await db.doc('users/p1/devices/t1').set({ token: 't1' }); await db.doc('users/p1/devices/t2').set({ token: 't2' });
  const m = fake(); const r = await pushNotice(db, m, { personId: 'p1', title: 'Hi', body: 'There', link: '/events/x' });
  assert.deepEqual(m.calls[0].tokens.sort(), ['t1', 't2']); assert.equal(m.calls[0].data.link, '/events/x'); assert.equal(r.sent, 2);
});
await test('push removes tokens FCM reports as dead, keeps the rest', async () => {
  const m = fake({ t2: 'messaging/registration-token-not-registered' });
  const r = await pushNotice(db, m, { personId: 'p1', title: 'Hi', body: 'There' });
  assert.equal(r.removed, 1); assert.equal((await db.doc('users/p1/devices/t2').get()).exists, false); assert.equal((await db.doc('users/p1/devices/t1').get()).exists, true);
});
await test('push to a user with no devices sends nothing', async () => {
  const m = fake(); const r = await pushNotice(db, m, { personId: 'nobody', title: 'x', body: 'y' });
  assert.equal(m.calls.length, 0); assert.equal(r.sent, 0);
});

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
