import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const VALID_USERNAME = "Oldemar";

  const login = (username, password) => {
    // Exact-case match on purpose: the app has one user, and accepting any
    // casing ("oldemar", "OLDEMAR", ...) made it feel like the username
    // field wasn't actually being checked.
    if (username !== VALID_USERNAME) {
      return Promise.reject(new Error("auth/invalid-credential"));
    }
    const email = `${username.toLowerCase()}@prestamosdemar.local`;
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
