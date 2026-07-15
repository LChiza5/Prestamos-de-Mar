import { useEffect, useState } from "react";
import { createLoan, listLoansForClient } from "../../services/loansService";
import AddLoanForm from "./AddLoanForm";
import LoanCard from "./LoanCard";
import ReceiptModal from "../Receipt/ReceiptModal";

export default function ClientDetailScreen({ clientId, clientName }) {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  const refresh = () => listLoansForClient(clientId).then(setLoans);

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

  return (
    <div>
      <h2>{clientName}</h2>
      <button className="btn" onClick={() => setShowReceipt(true)}>
        Generar comprobante
      </button>

      <AddLoanForm onCreateLoan={handleCreateLoan} />

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
