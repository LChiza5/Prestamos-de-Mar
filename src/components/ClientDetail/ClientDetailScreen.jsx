import { useEffect, useState } from "react";
import { createLoan, listLoansForClient } from "../../services/loansService";
import { deleteClient } from "../../services/clientsService";
import { formatMoney } from "../../utils/money";
import AddLoanForm from "./AddLoanForm";
import LoanCard from "./LoanCard";
import ReceiptModal from "../Receipt/ReceiptModal";
import {
  ReceiptIcon,
  HistoryIcon,
  PhoneIcon,
  TrashIcon,
} from "../icons/Icons";

export default function ClientDetailScreen({
  clientId,
  clientName,
  clientPhone,
  onBack,
}) {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

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

  const handleCreateLoan = async (principal, rate, startDate) => {
    await createLoan(clientId, principal, rate, startDate);
    refresh();
  };

  const handleDeleteClient = async () => {
    const confirmed = window.confirm(
      `¿Eliminar a "${clientName}" por completo? Esto borra al cliente, todos sus préstamos y todo su historial de abonos - a diferencia de eliminar una factura, esto NO se puede deshacer ni se conserva para reclamos.`
    );
    if (!confirmed) return;
    await deleteClient(clientId);
    onBack();
  };

  if (loadingData) {
    return <p>Cargando préstamos...</p>;
  }

  const visibleLoans = loans.filter((loan) => loan.status !== "deleted");
  const deletedLoans = loans.filter((loan) => loan.status === "deleted");

  const totalDebt = visibleLoans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  const totalInterestEarned = visibleLoans.reduce(
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
        {clientPhone && (
          <p className="client-phone">
            <PhoneIcon size={16} /> {clientPhone}
          </p>
        )}
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
        <div className="loan-card-actions">
          <button className="btn" onClick={() => setShowReceipt(true)}>
            <ReceiptIcon size={18} /> Generar comprobante
          </button>
          <button className="btn btn-danger" onClick={handleDeleteClient}>
            <TrashIcon size={18} /> Eliminar cliente
          </button>
        </div>
      </div>

      <AddLoanForm onCreateLoan={handleCreateLoan} />

      {visibleLoans.length === 0 && (
        <div className="empty-state">
          Este cliente no tiene préstamos aún. Agrega el primero arriba.
        </div>
      )}

      {visibleLoans.map((loan) => (
        <LoanCard
          key={loan.id}
          clientId={clientId}
          loan={loan}
          onPaymentRegistered={refresh}
        />
      ))}

      {deletedLoans.length > 0 && (
        <div className="card">
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleted((v) => !v)}
          >
            <HistoryIcon size={18} />
            {showDeleted
              ? "Ocultar facturas eliminadas"
              : `Ver facturas eliminadas (${deletedLoans.length})`}
          </button>
          <p className="muted deleted-loans-note">
            El historial de abonos de una factura eliminada se conserva aquí
            por si el cliente reclama algo más adelante.
          </p>
        </div>
      )}

      {showDeleted &&
        deletedLoans.map((loan) => (
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
