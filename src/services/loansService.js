import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { listClients } from "./clientsService";
import { processCorte } from "./interestEngine";
import { round2 } from "../utils/money";

function loansCol(clientId) {
  return collection(db, "clients", clientId, "loans");
}

function paymentsCol(clientId, loanId) {
  return collection(db, "clients", clientId, "loans", loanId, "payments");
}

export async function createLoan(clientId, principal, rate, startDate) {
  // A plain Date (not serverTimestamp()) so the field is immediately usable:
  // orderBy() on a serverTimestamp() field excludes the document from query
  // results locally until the server ack resolves the pending null value,
  // which made brand-new loans vanish from the list right after creating them.
  // startDate defaults to now, but callers can pass a past date when
  // migrating a credit that was already running before it entered the app.
  const docRef = await addDoc(loansCol(clientId), {
    principal: round2(principal),
    rate,
    remainingBalance: round2(principal),
    totalInterestEarned: 0,
    status: "active",
    startDate: startDate ?? new Date(),
  });
  return docRef.id;
}

export async function listLoansForClient(clientId) {
  const q = query(loansCol(clientId), orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Built from listClients()/listLoansForClient() instead of a collectionGroup
// query. Both of those are already proven to work in production, and a
// collectionGroup("loans") query was returning "Missing or insufficient
// permissions" in the field despite rules that should allow it - rather than
// keep guessing why, this avoids that code path entirely. Fine at this app's
// scale (one lender, at most a few dozen clients).
export async function listAllLoans() {
  const clients = await listClients();
  const loansPerClient = await Promise.all(
    clients.map(async (client) => {
      const loans = await listLoansForClient(client.id);
      // listLoansForClient() doesn't include clientId in each loan doc
      // (Firestore subcollection docs don't carry their parent's id), so it
      // has to be attached here for callers that need to group loans back
      // by client (like the dashboard's per-client breakdown).
      return loans.map((loan) => ({ ...loan, clientId: client.id }));
    })
  );
  return loansPerClient.flat();
}

// Oldemar doesn't take an abono into account the moment it's handed over -
// it sits "pendiente" (untouched, balance/interest unaffected) until he
// decides to hacer corte. So registering an abono just records the amount;
// it never updates the loan itself. This also means it works offline
// (rural signal gaps) with a plain addDoc, no transaction needed.
export async function addPayment(clientId, loanId, amount) {
  await addDoc(paymentsCol(clientId, loanId), {
    amount: round2(amount),
    status: "pendiente",
    interestPortion: null,
    principalPortion: null,
    date: new Date(),
  });
}

export async function listPendingPayments(clientId, loanId) {
  const q = query(
    paymentsCol(clientId, loanId),
    where("status", "==", "pendiente"),
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Applies every abono left "pendiente" on this loan, in the order they were
// received, using the same balance-based formula as before - just deferred
// until Oldemar presses "Hacer corte" instead of running per abono.
export async function runCorte(clientId, loanId, currentLoan) {
  const pending = await listPendingPayments(clientId, loanId);
  if (pending.length === 0) return null;

  const { results, finalBalance, totalInterestAdded } = processCorte(
    currentLoan.remainingBalance,
    currentLoan.rate,
    pending.map((p) => p.amount)
  );

  const batch = writeBatch(db);

  pending.forEach((payment, i) => {
    batch.update(doc(db, "clients", clientId, "loans", loanId, "payments", payment.id), {
      status: "aplicado",
      interestPortion: results[i].interestPortion,
      principalPortion: results[i].principalPortion,
    });
  });

  const newTotalInterest = round2(
    currentLoan.totalInterestEarned + totalInterestAdded
  );
  batch.update(doc(db, "clients", clientId, "loans", loanId), {
    remainingBalance: finalBalance,
    totalInterestEarned: newTotalInterest,
    status: finalBalance <= 0 ? "paid" : "active",
  });

  await batch.commit();

  return { finalBalance, totalInterestAdded, paymentsApplied: pending.length };
}

export async function deleteLoan(clientId, loanId) {
  await deleteDoc(doc(db, "clients", clientId, "loans", loanId));
}

export async function listPaymentsForLoan(clientId, loanId) {
  const q = query(paymentsCol(clientId, loanId), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
