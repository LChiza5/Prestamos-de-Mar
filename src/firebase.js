import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Session-only persistence: closing the app/tab signs Oldemar out, so
// whoever opens it next always sees the login screen instead of a stale
// logged-in session.
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn("No se pudo configurar la persistencia de sesión:", err.code);
});

enableIndexedDbPersistence(db).catch((err) => {
  console.warn("No se pudo activar la persistencia offline:", err.code);
});
