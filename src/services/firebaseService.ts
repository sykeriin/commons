import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, serverTimestamp, Timestamp, addDoc, arrayUnion, arrayRemove, increment, collectionGroup 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';

// User Services
export const syncUser = async (user: any) => {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const userData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        major: 'Undeclared',
        graduationYear: '2027',
        karma: 0,
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, userData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
};

export const getUserData = (uid: string, callback: (data: any) => void) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  });
};

// Club Services
export const createClub = async (clubData: any) => {
  const clubsRef = collection(db, 'clubs');
  try {
    const newClubRef = doc(clubsRef);
    const data = {
      ...clubData,
      id: newClubRef.id,
      memberCount: 1,
      createdAt: serverTimestamp()
    };
    await setDoc(newClubRef, data);
    
    // Add owner as first member
    const memberRef = doc(db, `clubs/${newClubRef.id}/members`, clubData.ownerUid);
    await setDoc(memberRef, {
      clubId: newClubRef.id,
      userUid: clubData.ownerUid,
      role: 'owner'
    });
    
    return newClubRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'clubs');
  }
};

export const getClubs = (callback: (clubs: any[]) => void) => {
  const clubsRef = collection(db, 'clubs');
  return onSnapshot(clubsRef, (snapshot) => {
    const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(clubs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'clubs');
  });
};

export const getOwnedClubs = (ownerUid: string, callback: (clubs: any[]) => void) => {
  const clubsRef = collection(db, 'clubs');
  const q = query(clubsRef, where('ownerUid', '==', ownerUid));
  return onSnapshot(q, (snapshot) => {
    const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(clubs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'clubs');
  });
};

export const getMemberships = (userUid: string, callback: (memberships: any[]) => void) => {
  const membershipsRef = collectionGroup(db, 'members');
  const q = query(membershipsRef, where('userUid', '==', userUid));
  return onSnapshot(q, (snapshot) => {
    const memberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(memberships);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `memberships?userUid=${userUid}`);
  });
};

export const joinClub = async (clubId: string, userUid: string) => {
  const memberRef = doc(db, `clubs/${clubId}/members`, userUid);
  const clubRef = doc(db, 'clubs', clubId);
  try {
    await setDoc(memberRef, {
      clubId,
      userUid,
      role: 'member'
    });
    await updateDoc(clubRef, {
      memberCount: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `clubs/${clubId}/members/${userUid}`);
  }
};

// Event Services
export const getEvents = (callback: (events: any[]) => void) => {
  const eventsRef = collection(db, 'events');
  return onSnapshot(eventsRef, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'events');
  });
};

export const rsvpToEvent = async (eventId: string, userUid: string, status: string) => {
  const rsvpRef = doc(db, `events/${eventId}/rsvps`, userUid);
  const eventRef = doc(db, 'events', eventId);
  try {
    const rsvpSnap = await getDoc(rsvpRef);
    const isNew = !rsvpSnap.exists();
    
    await setDoc(rsvpRef, {
      eventId,
      userUid,
      status
    });
    
    if (isNew && status === 'attending') {
      await updateDoc(eventRef, {
        attendeeCount: increment(1)
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${eventId}/rsvps/${userUid}`);
  }
};

export const createEvent = async (eventData: any) => {
  const eventsRef = collection(db, 'events');
  try {
    const newEventRef = doc(eventsRef);
    const data = {
      ...eventData,
      id: newEventRef.id,
      attendeeCount: 0,
      createdAt: serverTimestamp()
    };
    await setDoc(newEventRef, data);
    return newEventRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'events');
  }
};

export const getClubEvents = (clubId: string, callback: (events: any[]) => void) => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('clubId', '==', clubId));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `events?clubId=${clubId}`);
  });
};

export const getClubMembers = (clubId: string, callback: (members: any[]) => void) => {
  const membersRef = collection(db, `clubs/${clubId}/members`);
  return onSnapshot(membersRef, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(members);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `clubs/${clubId}/members`);
  });
};

export const completeCommonsSelection = async (uid: string, selected: string[]) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      hasSelectedCommons: true,
      selectedCommons: selected,
      karma: increment(50)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
};

export const setUserRole = async (uid: string, role: 'student' | 'club' | 'coordinator') => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `events/${eventId}`);
  }
};
