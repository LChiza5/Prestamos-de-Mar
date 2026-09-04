import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
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
  const effectiveStartDate = startDate ?? new Date();
  const docRef = await addDoc(loansCol(clientId), {
    principal: round2(principal),
    rate,
    remainingBalance: round2(principal),
    totalInterestEarned: 0,
    status: "active",
    startDate: effectiveStartDate,
    // Tracks the last time Oldemar had contact with this client about this
    // loan (a new abono, even pending), so the clients list can flag who
    // hasn't paid in a while without having to fetch every loan's full
    // payment history just to compute that.
    lastActivityDate: effectiveStartDate,
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
export async function addPayment(clientId, loanId, amount, currentLoan) {
  // Simulate a corte as if this abono were added to the pending queue right
  // now, using the exact same math hacer corte will actually use later.
  // If this abono (the last one in that simulation) would leave money over
  // - more than what's needed to fully settle the loan - reject it instead
  // of silently capping it at corte time.
  const pending = await listPendingPayments(clientId, loanId);
  const amounts = [...pending.map((p) => p.amount), round2(amount)];
  const { results } = processCorte(
    currentLoan.remainingBalance,
    currentLoan.rate,
    amounts
  );
  const last = results[results.length - 1];
  const theoreticalPrincipal = round2(round2(amount) - last.interestPortion);
  if (last.principalPortion < theoreticalPrincipal) {
    throw new Error(
      "Este abono (sumado a los que ya están pendientes) sobrepasa lo necesario para saldar la deuda. Ajusta el monto o haz el corte primero."
    );
  }

  await addDoc(paymentsCol(clientId, loanId), {
    amount: round2(amount),
    status: "pendiente",
    interestPortion: null,
    principalPortion: null,
    date: new Date(),
  });

  await updateDoc(doc(db, "clients", clientId, "loans", loanId), {
    lastActivityDate: new Date(),
  });
}

function toMillis(dateValue) {
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  return date.getTime();
}

// Filters/sorts in JS instead of a Firestore where()+orderBy() on different
// fields, which needs a manually-created composite index (a "Missing index"
// error the first time it runs) - not worth it for a per-loan collection
// this small.
export async function listPendingPayments(clientId, loanId) {
  const all = await listPaymentsForLoan(clientId, loanId);
  return all
    .filter((p) => p.status === "pendiente")
    .sort((a, b) => toMillis(a.date) - toMillis(b.date));
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
    // Snapshot of "before" so a mistaken corte can be undone. Only the most
    // recent corte is recoverable - running another corte (or undoing this
    // one) overwrites/clears it.
    lastCorte: {
      paymentIds: pending.map((p) => p.id),
      previousBalance: currentLoan.remainingBalance,
      previousTotalInterestEarned: currentLoan.totalInterestEarned,
      appliedAt: new Date(),
    },
  });

  await batch.commit();

  return { finalBalance, totalInterestAdded, paymentsApplied: pending.length };
}

// Reverses the most recent corte on this loan: the payments that were
// applied go back to "pendiente" (interest/principal cleared), and the loan
// balance/interest return to what they were right before that corte ran.
export async function undoLastCorte(clientId, loanId, currentLoan) {
  const lastCorte = currentLoan.lastCorte;
  if (!lastCorte) {
    throw new Error("Este préstamo no tiene un corte reciente para deshacer");
  }

  const batch = writeBatch(db);

  lastCorte.paymentIds.forEach((paymentId) => {
    batch.update(
      doc(db, "clients", clientId, "loans", loanId, "payments", paymentId),
      {
        status: "pendiente",
        interestPortion: null,
        principalPortion: null,
      }
    );
  });

  batch.update(doc(db, "clients", clientId, "loans", loanId), {
    remainingBalance: lastCorte.previousBalance,
    totalInterestEarned: lastCorte.previousTotalInterestEarned,
    status: lastCorte.previousBalance <= 0 ? "paid" : "active",
    lastCorte: null,
  });

  await batch.commit();
}

// A soft delete (not deleteDoc) so the payment history survives - Oldemar
// needs to still be able to show a client's full abono record even after
// taking a settled/abandoned loan off the active list, in case the client
// disputes something later.
export async function deleteLoan(clientId, loanId) {
  await updateDoc(doc(db, "clients", clientId, "loans", loanId), {
    status: "deleted",
    deletedAt: new Date(),
  });
}

export async function listPaymentsForLoan(clientId, loanId) {
  const q = query(paymentsCol(clientId, loanId), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
