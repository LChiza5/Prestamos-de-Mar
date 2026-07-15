import { useEffect, useState } from "react";
import { listAllLoans } from "../../services/loansService";
import { formatMoney } from "../../utils/money";

export default function DashboardScreen() {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    listAllLoans()
      .then(setLoans)
      .catch((error) => {
        console.error(error);
        setLoadError("No se pudo cargar el resumen: " + error.message);
      })
      .finally(() => setLoadingData(false));
  }, []);

  if (loadingData) {
    return <p>Cargando resumen...</p>;
  }

  if (loadError) {
    return <p className="error">{loadError}</p>;
  }

  const totalActiveDebt = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  const totalInterestEarned = loans.reduce(
    (sum, loan) => sum + loan.totalInterestEarned,
    0
  );

  return (
    <div className="card">
      <h2>Resumen general</h2>
      <p className="stat">
        <span>Dinero prestado activo:</span>
        <strong className="money-value">₡{formatMoney(totalActiveDebt)}</strong>
      </p>
      <p className="stat">
        <span>Interés total ganado:</span>
        <strong className="money-value">
          ₡{formatMoney(totalInterestEarned)}
        </strong>
      </p>
    </div>
  );
}
