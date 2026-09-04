import { useEffect, useState } from "react";
import {
  addPayment,
  deleteLoan,
  listPaymentsForLoan,
  runCorte,
} from "../../services/loansService";
import { formatMoney, parseMoney } from "../../utils/money";
import {
  BanknoteIcon,
  HistoryIcon,
  TrashIcon,
  ScissorsIcon,
} from "../icons/Icons";

function daysSince(dateValue) {
  if (!dateValue) return null;
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateTime(dateValue) {
  if (!dateValue) return "";
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return date.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LoanCard({ clientId, loan, onPaymentRegistered }) {
  const [payments, setPayments] = useState([]);
  const [amountText, setAmountText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [runningCorte, setRunningCorte] = useState(false);

  // Fetched regardless of whether the history panel is open - the pending
  // abonos section (and its "Hacer corte" button) needs to always be
  // visible, not just inside the collapsed history.
  const refreshPayments = () =>
    listPaymentsForLoan(clientId, loan.id)
      .then((data) => {
        setPayments(data);
        setHistoryError("");
      })
      .catch((error) => {
        console.error(error);
        setHistoryError("No se pudo cargar el historial: " + error.message);
      });

  useEffect(() => {
    refreshPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan.id]);

  const pendingPayments = payments.filter((p) => p.status === "pendiente");
  const appliedPayments = payments.filter((p) => p.status !== "pendiente");
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const lastPaymentDate = payments[0]?.date ?? loan.startDate;

  const handlePay = async () => {
    const amount = parseMoney(amountText);
    if (amount <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    try {
      await addPayment(clientId, loan.id, amount);
      setAmountText("");
      refreshPayments();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCorte = async () => {
    const confirmed = window.confirm(
      `¿Aplicar el corte con ${pendingPayments.length} abono(s) pendiente(s) por un total de ₡${formatMoney(
        pendingTotal
      )}? Esto va a recalcular el interés y bajar la deuda.`
    );
    if (!confirmed) return;

    setRunningCorte(true);
    try {
      await runCorte(clientId, loan.id, loan);
      await refreshPayments();
      onPaymentRegistered();
    } catch (error) {
      alert(error.message);
    } finally {
      setRunningCorte(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Eliminar esta factura? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;
    await deleteLoan(clientId, loan.id);
    onPaymentRegistered();
  };

  return (
    <div className="card">
      <div className="loan-card-header">
        <strong className="money-value">
          ₡{formatMoney(loan.principal)} al {loan.rate}%
        </strong>
        <span
          className={`rating-badge ${
            loan.status === "paid" ? "rating-green" : "rating-yellow"
          }`}
        >
          {loan.status === "paid" ? "Pagado" : "Activo"}
        </span>
      </div>
      <p className="stat">
        <span>Deuda actual:</span>
        <strong className="money-value">
          ₡{formatMoney(loan.remainingBalance)}
        </strong>
      </p>
      <p className="muted">
        Días desde el último abono: {daysSince(lastPaymentDate) ?? "N/A"}
      </p>

      {loan.status === "active" && (
        <div>
          <input
            className="input"
            placeholder="Monto a abonar (ej: 10,000.00)"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
          <button className="btn" onClick={handlePay}>
            <BanknoteIcon size={18} /> Registrar abono
          </button>
        </div>
      )}

      {pendingPayments.length > 0 && (
        <div className="pending-payments">
          <p className="pending-payments-title">
            Abonos pendientes de corte ({pendingPayments.length}) — total ₡
            {formatMoney(pendingTotal)}
          </p>
          {pendingPayments.map((p) => (
            <div key={p.id} className="pending-payment-row">
              <span className="payment-date">{formatDateTime(p.date)}</span>
              <span className="money-value">₡{formatMoney(p.amount)}</span>
            </div>
          ))}
          <p className="muted">
            Estos abonos todavía no bajan la deuda. Al hacer el corte se
            calcula el interés sobre el saldo actual y el resto pasa a
            capital.
          </p>
          <button className="btn btn-secondary" onClick={handleCorte} disabled={runningCorte}>
            <ScissorsIcon size={18} />{" "}
            {runningCorte ? "Aplicando corte..." : "Hacer corte"}
          </button>
        </div>
      )}

      <div className="loan-card-actions">
        <button
          className="btn btn-secondary"
          onClick={() => setShowHistory((v) => !v)}
        >
          <HistoryIcon size={18} />
          {showHistory ? "Ocultar historial" : "Ver historial"}
        </button>

        <button className="btn btn-danger" onClick={handleDelete}>
          <TrashIcon size={18} /> Eliminar factura
        </button>
      </div>

      {showHistory && (
        <div className="payment-history">
          {historyError && <p className="error">{historyError}</p>}
          {!historyError && appliedPayments.length === 0 && (
            <p className="muted">Aún no hay abonos aplicados en un corte</p>
          )}
          {appliedPayments.map((p) => (
            <div key={p.id} className="payment-row">
              <span className="payment-date">{formatDateTime(p.date)}</span>
              <span className="payment-amount money-value">
                ₡{formatMoney(p.amount)}
              </span>
              <span className="money-value payment-breakdown">
                interés ₡{formatMoney(p.interestPortion)}, capital ₡
                {formatMoney(p.principalPortion)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
