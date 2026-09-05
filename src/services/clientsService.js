import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const clientsCol = collection(db, "clients");

export async function createClient(name, rating, phone = "") {
  const docRef = await addDoc(clientsCol, {
    name,
    rating,
    phone,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listClients() {
  const q = query(clientsCol, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateClientRating(clientId, rating) {
  await updateDoc(doc(db, "clients", clientId), { rating });
}
