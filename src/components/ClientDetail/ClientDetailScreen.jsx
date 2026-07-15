import { useEffect, useState } from "react";
import { createLoan, listLoansForClient } from "../../services/loansService";
import { formatMoney } from "../../utils/money";
import AddLoanForm from "./AddLoanForm";
import LoanCard from "./LoanCard";
import ReceiptModal from "../Receipt/ReceiptModal";
import { ReceiptIcon } from "../icons/Icons";

export default function ClientDetailScreen({ clientId, clientName, onBack }) {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  const refresh = () =>
    listLoansForClient(clientId)
      .then((data) => {
        setLoans(data);
        setLoadError("");
      })
      .catch((error) => {
        console.error(error);
        setLoadError("No se pudieron cargar los préstamos: " + error.message);
      });

  useEffect(() => {
    refresh().finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleCreateLoan = async (principal, rate) => {
    await createLoan(clientId, principal, rate);
    refresh();
  };

  if (loadingData) {
    return <p>Cargando préstamos...</p>;
  }

  const totalDebt = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  const totalInterestEarned = loans.reduce(
    (sum, loan) => sum + loan.totalInterestEarned,
    0
  );

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← Volver a clientes
      </button>

      {loadError && <p className="error">{loadError}</p>}

      <div className="card">
        <h2>{clientName}</h2>
        <p className="stat">
          <span>Deuda activa total:</span>
          <strong className="money-value">₡{formatMoney(totalDebt)}</strong>
        </p>
        <p className="stat">
          <span>Interés ganado (este cliente):</span>
          <strong className="money-value">
            ₡{formatMoney(totalInterestEarned)}
          </strong>
        </p>
        <button className="btn" onClick={() => setShowReceipt(true)}>
          <ReceiptIcon size={18} /> Generar comprobante
        </button>
      </div>

      <AddLoanForm onCreateLoan={handleCreateLoan} />

      {loans.length === 0 && (
        <p className="muted">
          Este cliente no tiene préstamos aún. Agrega el primero arriba.
        </p>
      )}

      {loans.map((loan) => (
        <LoanCard
          key={loan.id}
          clientId={clientId}
          loan={loan}
          onPaymentRegistered={refresh}
        />
      ))}

      {showReceipt && (
        <ReceiptModal
          clientName={clientName}
          totalDebt={totalDebt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
