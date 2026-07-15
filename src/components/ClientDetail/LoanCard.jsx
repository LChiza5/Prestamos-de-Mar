import { useEffect, useState } from "react";
import { addPayment, listPaymentsForLoan } from "../../services/loansService";
import { formatMoney, parseMoney } from "../../utils/money";

function daysSince(dateValue) {
  if (!dateValue) return null;
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function LoanCard({ clientId, loan, onPaymentRegistered }) {
  const [payments, setPayments] = useState([]);
  const [amountText, setAmountText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const refreshPayments = () =>
    listPaymentsForLoan(clientId, loan.id).then(setPayments);

  useEffect(() => {
    if (showHistory) refreshPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const lastPaymentDate = payments[0]?.date ?? loan.startDate;

  const handlePay = async () => {
    const amount = parseMoney(amountText);
    if (amount <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    try {
      await addPayment(clientId, loan.id, amount, loan);
      setAmountText("");
      if (showHistory) refreshPayments();
      onPaymentRegistered();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="card">
      <p>
        <strong>Préstamo:</strong> ₡{formatMoney(loan.principal)} al {loan.rate}%
      </p>
      <p>
        <strong>Deuda actual:</strong> ₡{formatMoney(loan.remainingBalance)} —{" "}
        {loan.status === "paid" ? "Pagado" : "Activo"}
      </p>
      <p className="muted">
        Días desde el último abono: {daysSince(lastPaymentDate) ?? "N/A"}
      </p>

      {loan.status === "active" && (
        <div>
          <input
            className="input"
            placeholder="Monto a abonar"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
          <button className="btn" onClick={handlePay}>
            Registrar abono
          </button>
        </div>
      )}

      <button className="link-btn" onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? "Ocultar historial" : "Ver historial de abonos"}
      </button>

      {showHistory && (
        <div>
          {payments.length === 0 && <p>No hay abonos aún</p>}
          {payments.map((p) => (
            <div key={p.id} className="muted">
              ₡{formatMoney(p.amount)} (interés ₡{formatMoney(p.interestPortion)},
              capital ₡{formatMoney(p.principalPortion)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
