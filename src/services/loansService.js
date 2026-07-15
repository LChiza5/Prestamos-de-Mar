import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { splitPayment } from "./interestEngine";
import { round2 } from "../utils/money";

function loansCol(clientId) {
  return collection(db, "clients", clientId, "loans");
}

function paymentsCol(clientId, loanId) {
  return collection(db, "clients", clientId, "loans", loanId, "payments");
}

export async function createLoan(clientId, principal, rate) {
  const docRef = await addDoc(loansCol(clientId), {
    principal: round2(principal),
    rate,
    remainingBalance: round2(principal),
    totalInterestEarned: 0,
    status: "active",
    startDate: serverTimestamp(),
  });
  return docRef.id;
}

export async function listLoansForClient(clientId) {
  const q = query(loansCol(clientId), orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAllLoans() {
  const snapshot = await getDocs(collectionGroup(db, "loans"));
  return snapshot.docs.map((d) => ({
    id: d.id,
    clientId: d.ref.parent.parent.id,
    ...d.data(),
  }));
}

// Firestore transactions require live connectivity, but registering an abono
// must keep working offline (rural signal gaps). So the new balance is
// computed from the already-loaded `currentLoan` object and written with a
// plain updateDoc, which Firestore's offline write queue does support.
export async function addPayment(clientId, loanId, amount, currentLoan) {
  if (amount > currentLoan.remainingBalance) {
    throw new Error("El abono no puede ser mayor a la deuda pendiente");
  }

  const { interestPortion, principalPortion } = splitPayment(
    amount,
    currentLoan.rate
  );
  const newBalance = round2(currentLoan.remainingBalance - principalPortion);
  const newTotalInterest = round2(
    currentLoan.totalInterestEarned + interestPortion
  );

  const loanRef = doc(db, "clients", clientId, "loans", loanId);
  await updateDoc(loanRef, {
    remainingBalance: newBalance,
    totalInterestEarned: newTotalInterest,
    status: newBalance <= 0 ? "paid" : "active",
  });

  await addDoc(paymentsCol(clientId, loanId), {
    amount: round2(amount),
    interestPortion,
    principalPortion,
    date: serverTimestamp(),
  });

  return { interestPortion, principalPortion, newBalance };
}

export async function deleteLoan(clientId, loanId) {
  await deleteDoc(doc(db, "clients", clientId, "loans", loanId));
}

export async function listPaymentsForLoan(clientId, loanId) {
  const q = query(paymentsCol(clientId, loanId), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
