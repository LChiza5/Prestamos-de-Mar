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

  const login = (username, password) => {
    const email = `${username.toLowerCase()}@prestamosdemar.local`;
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
