import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/Login/LoginScreen";
import DashboardScreen from "./components/Dashboard/DashboardScreen";
import ClientsListScreen from "./components/Clients/ClientsListScreen";
import ClientDetailScreen from "./components/ClientDetail/ClientDetailScreen";
import SimulatorScreen from "./components/Simulator/SimulatorScreen";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);

  if (loading) {
    return <div className="full-screen-center">Cargando...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const openClient = (client) => {
    setSelectedClient(client);
    setView("clientDetail");
  };

  return (
    <div>
      <nav className="app-nav">
        <button className="btn" onClick={() => setView("dashboard")}>
          Resumen
        </button>
        <button className="btn" onClick={() => setView("clients")}>
          Clientes
        </button>
        <button className="btn" onClick={() => setView("simulator")}>
          Simulador
        </button>
        <button className="btn btn-danger" onClick={logout}>
          Cerrar sesión
        </button>
      </nav>

      <main className="app-content">
        {view === "dashboard" && <DashboardScreen />}
        {view === "clients" && <ClientsListScreen onSelectClient={openClient} />}
        {view === "clientDetail" && selectedClient && (
          <ClientDetailScreen
            clientId={selectedClient.id}
            clientName={selectedClient.name}
          />
        )}
        {view === "simulator" && <SimulatorScreen />}
      </main>
    </div>
  );
}
