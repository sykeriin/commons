import { Capacitor } from '@capacitor/core';
import { doc, setDoc, type Firestore } from 'firebase/firestore';

/**
 * Native push: ask permission, get an FCM token, store it under users/{uid}/devices so the Cloud Function that
 * sends notifications can find it. No-op in a browser. Needs google-services.json / GoogleService-Info.plist and
 * APNs keys uploaded to Firebase, which are not in this repo. Not yet run on a physical device.
 */
export async function registerPush(uid: string, db: Firestore, onOpen: (link: string) => void) {
  if (!Capacitor.isNativePlatform()) return;
  const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
  const perm = await FirebaseMessaging.requestPermissions();
  if (perm.receive !== 'granted') return;
  const save = async (token: string) => setDoc(doc(db, `users/${uid}/devices/${token}`), { token, platform: Capacitor.getPlatform(), createdAt: new Date().toISOString() });
  await save((await FirebaseMessaging.getToken()).token);
  await FirebaseMessaging.addListener('tokenReceived', e => { save(e.token).catch(() => {}); });
  await FirebaseMessaging.addListener('notificationActionPerformed', e => { const link = (e.notification.data as { link?: string } | undefined)?.link; if (link) onOpen(link); });
}
