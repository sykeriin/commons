import type { Firestore, Query, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';

/**
 * Seat and waitlist logic. Firestore security rules cannot count documents, so two people racing for the last
 * seat could both win if the client wrote enrolments itself. These handlers do the count and the write inside
 * one transaction, so the capacity limit holds no matter how many requests arrive at once.
 *
 * They take a Firestore instance and a verified caller id, so they can be tested against the emulator
 * without the Functions runtime. index.ts wraps them as callable functions.
 */

export class AppError extends Error {
  constructor(public code: 'invalid-argument' | 'permission-denied' | 'not-found' | 'failed-precondition', message: string) { super(message); }
}

const TX = { maxAttempts: 30 }; // many students enrol at the same instant on day one; let contention retry
const nowIso = () => new Date().toISOString();
const byCreated = (a: QueryDocumentSnapshot, b: QueryDocumentSnapshot) => String(a.get('createdAt') ?? '').localeCompare(String(b.get('createdAt') ?? ''));
const need = <T>(v: T | undefined | null | '', code: AppError['code'], msg: string): T => { if (!v) throw new AppError(code, msg); return v; };

export interface Caller { uid: string; role: string }

export async function callerOf(db: Firestore, uid: string, emailVerifiedBootstrap = false): Promise<Caller> {
  const snap = await db.doc(`users/${uid}`).get();
  return { uid, role: emailVerifiedBootstrap ? 'admin' : (snap.get('role') ?? 'none') };
}

async function firstWaiting(tx: Transaction, q: Query) {
  const docs = (await tx.get(q)).docs.sort(byCreated);
  return docs[0];
}

// ---------------------------------------------------------------- courses

export async function enroll(db: Firestore, caller: Caller, data: { sectionId?: string; studentId?: string }): Promise<'enrolled' | 'waitlisted'> {
  const sectionId = need(data.sectionId, 'invalid-argument', 'sectionId is required');
  const studentId = data.studentId ?? caller.uid;
  if (studentId !== caller.uid && caller.role !== 'admin') throw new AppError('permission-denied', 'You can only enrol yourself');
  return db.runTransaction(async tx => {
    const section = await tx.get(db.doc(`sections/${sectionId}`));
    if (!section.exists) throw new AppError('not-found', 'Section not found');
    if (!(await tx.get(db.doc(`users/${studentId}`))).exists) throw new AppError('not-found', 'Student not found');
    const col = db.collection('enrollments');
    const mine = (await tx.get(col.where('sectionId', '==', sectionId).where('studentId', '==', studentId))).docs[0];
    if (mine && mine.get('status') !== 'dropped') return mine.get('status') as 'enrolled' | 'waitlisted';
    const taken = (await tx.get(col.where('sectionId', '==', sectionId).where('status', '==', 'enrolled'))).size;
    const status = taken >= (section.get('capacity') ?? Infinity) ? 'waitlisted' : 'enrolled';
    const ref = mine ? mine.ref : col.doc(`${sectionId}_${studentId}`);
    tx.set(ref, { id: ref.id, sectionId, studentId, status, createdAt: nowIso() });
    return status;
  }, TX);
}

export async function drop(db: Firestore, caller: Caller, data: { sectionId?: string; studentId?: string }): Promise<void> {
  const sectionId = need(data.sectionId, 'invalid-argument', 'sectionId is required');
  const studentId = data.studentId ?? caller.uid;
  if (studentId !== caller.uid && caller.role !== 'admin') throw new AppError('permission-denied', 'You can only drop yourself');
  await db.runTransaction(async tx => {
    const col = db.collection('enrollments');
    const mine = (await tx.get(col.where('sectionId', '==', sectionId).where('studentId', '==', studentId))).docs[0];
    if (!mine || mine.get('status') === 'dropped') return;
    const next = mine.get('status') === 'enrolled' ? await firstWaiting(tx, col.where('sectionId', '==', sectionId).where('status', '==', 'waitlisted')) : undefined;
    tx.update(mine.ref, { status: 'dropped' });
    if (next) tx.update(next.ref, { status: 'enrolled' });
  }, TX);
}

// ---------------------------------------------------------------- events

export async function rsvp(db: Firestore, caller: Caller, data: { eventId?: string; status?: string }): Promise<'going' | 'waitlist' | 'maybe'> {
  const eventId = need(data.eventId, 'invalid-argument', 'eventId is required');
  if (data.status !== 'going' && data.status !== 'maybe') throw new AppError('invalid-argument', 'status must be going or maybe');
  const wanted = data.status;
  return db.runTransaction(async tx => {
    const ev = await tx.get(db.doc(`events/${eventId}`));
    if (!ev.exists) throw new AppError('not-found', 'Event not found');
    if (ev.get('approval') !== 'approved') throw new AppError('failed-precondition', 'This event is not open for RSVPs yet');
    const col = db.collection('rsvps');
    const ref = col.doc(`${eventId}_${caller.uid}`);
    const existing = await tx.get(ref);
    const going = (await tx.get(col.where('eventId', '==', eventId).where('status', '==', 'going'))).size;
    const alreadyGoing = existing.exists && existing.get('status') === 'going';
    const cap: number | undefined = ev.get('capacity');
    const status = wanted === 'going' && !alreadyGoing && cap !== undefined && going >= cap ? 'waitlist' : wanted;
    if (existing.exists && existing.get('status') === status) return status;
    tx.set(ref, { id: ref.id, eventId, personId: caller.uid, status, checkedIn: false, createdAt: nowIso() });
    return status;
  }, TX);
}

export async function cancelRsvp(db: Firestore, caller: Caller, data: { eventId?: string }): Promise<void> {
  const eventId = need(data.eventId, 'invalid-argument', 'eventId is required');
  await db.runTransaction(async tx => {
    const col = db.collection('rsvps');
    const ref = col.doc(`${eventId}_${caller.uid}`);
    const mine = await tx.get(ref);
    if (!mine.exists) return;
    const next = mine.get('status') === 'going' ? await firstWaiting(tx, col.where('eventId', '==', eventId).where('status', '==', 'waitlist')) : undefined;
    tx.delete(ref);
    if (next) tx.update(next.ref, { status: 'going' });
  }, TX);
}
