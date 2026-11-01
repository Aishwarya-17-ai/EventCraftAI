/**
 * EventCraft AI - Firebase Firestore & Auth Integration
 * Real-time synchronization, Google Authentication, and collaboration logic.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  addDoc,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { EventActivity, EventDocument, EventFormData } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handler conforming to skill requirements.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates initial connection to Firestore as per guidelines.
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.debug('Firebase offline or test document unreachable.');
    }
    return false;
  }
}

/**
 * Initiates Google Sign-In via popup.
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.debug('Google sign in error:', error);
    return null;
  }
}

/**
 * Signs out current user.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.debug('Logout error:', error);
  }
}

/**
 * Saves or updates an event document in Firestore.
 */
export async function saveEventToFirestore(eventData: EventDocument): Promise<void> {
  const path = `events/${eventData.id}`;
  try {
    const cleanDoc = {
      ...eventData,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'events', eventData.id), cleanDoc, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time changes of a single event.
 */
export function subscribeToEvent(
  eventId: string,
  onUpdate: (event: EventDocument | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `events/${eventId}`;
  const docRef = doc(db, 'events', eventId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as EventDocument);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to real-time activity messages for collaborative events.
 */
export function subscribeToActivities(
  eventId: string,
  onUpdate: (activities: EventActivity[]) => void
): Unsubscribe {
  const path = `events/${eventId}/activities`;
  const colRef = collection(db, 'events', eventId, 'activities');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: EventActivity[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as EventActivity);
      });
      // Sort newest first
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Posts a real-time collaboration note / activity message.
 */
export async function addEventActivity(
  eventId: string,
  message: string
): Promise<void> {
  if (!auth.currentUser) return;
  const path = `events/${eventId}/activities`;
  try {
    const activityId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: EventActivity = {
      id: activityId,
      eventId,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email || auth.currentUser.displayName || 'Collaborator',
      message,
      timestamp: new Date().toISOString(),
    };
    await setDoc(doc(db, 'events', eventId, 'activities', activityId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Adds an invited collaborator to the event with 'editor' or 'viewer' role.
 */
export async function addCollaboratorToEvent(
  eventId: string,
  emailOrUid: string,
  role: 'editor' | 'viewer'
): Promise<void> {
  const path = `events/${eventId}`;
  try {
    const snap = await getDoc(doc(db, 'events', eventId));
    if (!snap.exists()) return;
    const current = snap.data() as EventDocument;

    const editors = new Set(current.editors || []);
    const viewers = new Set(current.viewers || []);

    if (role === 'editor') {
      editors.add(emailOrUid);
      viewers.delete(emailOrUid);
    } else {
      viewers.add(emailOrUid);
      editors.delete(emailOrUid);
    }

    await setDoc(
      doc(db, 'events', eventId),
      {
        editors: Array.from(editors),
        viewers: Array.from(viewers),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
