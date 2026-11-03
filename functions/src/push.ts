import type { Firestore } from 'firebase-admin/firestore';

/** The slice of firebase-admin Messaging this module uses, so tests can pass a fake. */
export interface Messenger {
  sendEachForMulticast(m: { tokens: string[]; notification: { title: string; body: string }; data?: Record<string, string> }): Promise<{ responses: { success: boolean; error?: { code?: string } }[] }>;
}
const DEAD = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument']);

/** Send one notice to every device its recipient registered, and forget tokens FCM says are dead. */
export async function pushNotice(db: Firestore, messaging: Messenger, notice: { personId: string; title: string; body: string; link?: string }) {
  const devices = await db.collection(`users/${notice.personId}/devices`).get();
  const tokens = devices.docs.map(d => d.get('token') as string).filter(Boolean);
  if (!tokens.length) return { sent: 0, removed: 0 };
  const res = await messaging.sendEachForMulticast({ tokens, notification: { title: notice.title, body: notice.body }, data: notice.link ? { link: notice.link } : undefined });
  let removed = 0;
  await Promise.all(res.responses.map(async (r, i) => {
    if (!r.success && r.error?.code && DEAD.has(r.error.code)) { await devices.docs[i].ref.delete(); removed++; }
  }));
  return { sent: res.responses.filter(r => r.success).length, removed };
}
