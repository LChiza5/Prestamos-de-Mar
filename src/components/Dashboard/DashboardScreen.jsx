import { useEffect, useState } from "react";
import { listAllLoans } from "../../services/loansService";
import { listClients } from "../../services/clientsService";
import { formatMoney } from "../../utils/money";
import RatingBadge from "../Clients/RatingBadge";

export default function DashboardScreen() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([listAllLoans(), listClients()])
      .then(([loansData, clientsData]) => {
        setLoans(loansData);
        setClients(clientsData);
        setLoadError("");
      })
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

  const activeLoans = loans.filter((loan) => loan.status === "active");
  const totalActiveDebt = activeLoans.reduce(
    (sum, loan) => sum + loan.remainingBalance,
    0
  );
  const totalInterestEarned = loans.reduce(
    (sum, loan) => sum + loan.totalInterestEarned,
    0
  );

  // Same two numbers as above, broken down per client - this is what lets
  // Oldemar see exactly which abonos produced the interest total, since
  // interest only comes from abonos already made, not from the size of the
  // outstanding balance.
  const byClient = clients
    .map((client) => {
      const clientLoans = loans.filter((loan) => loan.clientId === client.id);
      const activeDebt = clientLoans
        .filter((loan) => loan.status === "active")
        .reduce((sum, loan) => sum + loan.remainingBalance, 0);
      const interestEarned = clientLoans.reduce(
        (sum, loan) => sum + loan.totalInterestEarned,
        0
      );
      const activeCount = clientLoans.filter(
        (loan) => loan.status === "active"
      ).length;
      return {
        client,
        activeDebt,
        interestEarned,
        activeCount,
        totalCount: clientLoans.length,
      };
    })
    .filter((row) => row.totalCount > 0)
    .sort((a, b) => b.activeDebt - a.activeDebt);

  return (
    <div>
      <div className="card">
        <h2>Resumen general</h2>
        <p className="stat">
          <span>Dinero prestado activo:</span>
          <strong className="money-value">
            ₡{formatMoney(totalActiveDebt)}
          </strong>
        </p>
        <p className="stat">
          <span>Interés total ganado:</span>
          <strong className="money-value">
            ₡{formatMoney(totalInterestEarned)}
          </strong>
        </p>
        <p className="stat">
          <span>Préstamos activos:</span>
          <strong className="money-value">{activeLoans.length}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Detalle por cliente</h3>
        <p className="muted">
          El interés ganado se genera abono por abono, no por el tamaño del
          préstamo — por eso un cliente con mucha deuda activa puede aportar
          poco interés todavía si no ha abonado.
        </p>

        {byClient.length === 0 && (
          <p className="muted">Aún no hay préstamos registrados.</p>
        )}

        {byClient.map(
          ({ client, activeDebt, interestEarned, activeCount, totalCount }) => (
            <div key={client.id} className="dashboard-client-row">
              <div className="dashboard-client-header">
                <span className="dashboard-client-name">{client.name}</span>
                <RatingBadge rating={client.rating} />
              </div>
              <div className="dashboard-client-stats">
                <span>
                  Saldo activo:{" "}
                  <strong className="money-value">
                    ₡{formatMoney(activeDebt)}
                  </strong>
                </span>
                <span>
                  Interés generado:{" "}
                  <strong className="money-value">
                    ₡{formatMoney(interestEarned)}
                  </strong>
                </span>
                <span>
                  {activeCount} de {totalCount} préstamo(s) activo(s)
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
