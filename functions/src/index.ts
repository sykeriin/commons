import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as h from './handlers';
import * as n from './notices';
import { pushNotice } from './push';

// Set FIRESTORE_DATABASE_ID in functions/.env if your project uses a named database. Otherwise the default one is used.
const DATABASE = process.env.FIRESTORE_DATABASE_ID || '(default)';
const app = initializeApp();
const db = getFirestore(app, DATABASE);
db.settings({ ignoreUndefinedProperties: true }); // notices without a link omit the field
const REGION = process.env.FUNCTIONS_REGION || 'us-central1';
const trig = { database: DATABASE, region: REGION };

// ------------------------------------------------------------ callables (seat and waitlist logic)

const BOOTSTRAP_ADMIN_EMAIL = 'durva.s170@gmail.com'; // keep in sync with src/lib/config.ts and firestore.rules
async function run<T>(req: CallableRequest<any>, fn: (c: h.Caller) => Promise<T>): Promise<T> {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first');
  const t = req.auth.token;
  try { return await fn(await h.callerOf(db, req.auth.uid, t.email === BOOTSTRAP_ADMIN_EMAIL && t.email_verified === true)); }
  catch (e) { if (e instanceof h.AppError) throw new HttpsError(e.code, e.message); throw e; }
}
export const enroll = onCall({ region: REGION }, req => run(req, c => h.enroll(db, c, req.data)));
export const drop = onCall({ region: REGION }, req => run(req, c => h.drop(db, c, req.data)));
export const rsvp = onCall({ region: REGION }, req => run(req, c => h.rsvp(db, c, req.data)));
export const cancelRsvp = onCall({ region: REGION }, req => run(req, c => h.cancelRsvp(db, c, req.data)));

// ------------------------------------------------------------ notification triggers

async function write(eventId: string, drafts: n.NoticeDraft[]) {
  await Promise.all(drafts.map(d => {
    const id = `n_${eventId}_${d.personId}`;
    return db.doc(`notices/${id}`).set({ id, ...d, createdAt: new Date().toISOString(), read: false }, { merge: false });
  }));
}
export const onGrade = onDocumentWritten({ ...trig, document: 'grades/{id}' }, async e => write(e.id, n.forGrade(e.data?.after.data(), e.data?.before.data())));
export const onAssignment = onDocumentCreated({ ...trig, document: 'assignments/{id}' }, async e => {
  const a = e.data?.data(); if (!a) return;
  const ids = (await db.collection('enrollments').where('sectionId', '==', a.sectionId).where('status', '==', 'enrolled').get()).docs.map(d => d.get('studentId') as string);
  await write(e.id, n.forAssignment(a, ids));
});
export const onJoinRequest = onDocumentWritten({ ...trig, document: 'joinRequests/{id}' }, async e => {
  const after = e.data?.after.data(); if (!after) return;
  const club = (await db.doc(`clubs/${after.clubId}`).get()).data(); if (!club) return;
  await write(`${e.id}_${after.status}`, n.forJoinRequest(after, e.data?.before.data(), club.name, club.presidentId));
});
export const onClub = onDocumentUpdated({ ...trig, document: 'clubs/{id}' }, async e => write(e.id, n.forClubDecision(e.data?.after.data(), e.data?.before.data())));
export const onEvent = onDocumentUpdated({ ...trig, document: 'events/{id}' }, async e => write(e.id, n.forEventDecision(e.data?.after.data(), e.data?.before.data())));
export const onRoleRequest = onDocumentUpdated({ ...trig, document: 'roleRequests/{id}' }, async e => write(e.id, n.forRoleDecision(e.data?.after.data(), e.data?.before.data())));
export const onEnrollment = onDocumentUpdated({ ...trig, document: 'enrollments/{id}' }, async e => {
  const a = e.data?.after.data(); await write(e.id, n.forSeatPromotion(a, e.data?.before.data(), 'enrollment', String(a?.sectionId ?? '').replace(/^sec-/, '').toUpperCase()));
});
export const onRsvp = onDocumentUpdated({ ...trig, document: 'rsvps/{id}' }, async e => {
  const a = e.data?.after.data(); const ev = a ? (await db.doc(`events/${a.eventId}`).get()).data() : undefined;
  await write(e.id, n.forSeatPromotion(a, e.data?.before.data(), 'rsvp', ev?.title ?? 'the event'));
});

// ------------------------------------------------------------ push

export const onNoticePush = onDocumentCreated({ ...trig, document: 'notices/{id}' }, async e => {
  const notice = e.data?.data(); if (!notice) return;
  await pushNotice(db, getMessaging(app), notice as any);
});
