import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
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

// A real, permanent delete (unlike loans' soft delete) - this is for
// removing a client entirely (e.g. test/mistake data), not settling a real
// one, so there's no dispute-history reason to keep it around. Cascades
// through every loan and every payment so nothing orphaned is left behind
// (Firestore doesn't delete subcollections on its own when a parent doc is
// deleted).
export async function deleteClient(clientId) {
  const loansSnapshot = await getDocs(
    collection(db, "clients", clientId, "loans")
  );

  const batch = writeBatch(db);

  for (const loanDoc of loansSnapshot.docs) {
    const paymentsSnapshot = await getDocs(
      collection(db, "clients", clientId, "loans", loanDoc.id, "payments")
    );
    paymentsSnapshot.docs.forEach((paymentDoc) => {
      batch.delete(paymentDoc.ref);
    });
    batch.delete(loanDoc.ref);
  }

  batch.delete(doc(db, "clients", clientId));

  await batch.commit();
}
