/**
 * ÚNICO punto de acceso a Firebase. Esta aplicación es de SOLO LECTURA:
 * aquí solo se usan funciones de lectura y src/data/readonly.test.ts falla si aparece una escritura.
 */
import { initializeApp } from 'firebase/app';
import { collection, collectionGroup, getFirestore, onSnapshot, type Query } from 'firebase/firestore';
import type { RawDoc } from '../domain/stats';

const env = import.meta.env;

export const isFirebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);

const db = isFirebaseConfigured
  ? getFirestore(
      initializeApp({
        apiKey: env.VITE_FIREBASE_API_KEY,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
        messagingSenderId: env.VITE_FIREBASE_SENDER_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      }),
    )
  : null;

export interface Feed {
  docs: RawDoc[];
  fromCache: boolean;
}

function listen(query: Query, onData: (feed: Feed) => void, onError: (error: Error) => void) {
  return onSnapshot(
    query,
    { includeMetadataChanges: true },
    (snapshot) =>
      onData({
        docs: snapshot.docs.map((doc) => ({ id: doc.id, path: doc.ref.path, data: doc.data() })),
        fromCache: snapshot.metadata.fromCache,
      }),
    onError,
  );
}

export function listenPlayers(onData: (feed: Feed) => void, onError: (error: Error) => void) {
  return listen(collection(db!, 'players'), onData, onError);
}

export function listenSurveys(onData: (feed: Feed) => void, onError: (error: Error) => void) {
  return listen(collection(db!, 'surveys'), onData, onError);
}

/** Todos los documentos players/{id}/worlds/{n}. */
export function listenWorlds(onData: (feed: Feed) => void, onError: (error: Error) => void) {
  return listen(collectionGroup(db!, 'worlds'), onData, onError);
}
