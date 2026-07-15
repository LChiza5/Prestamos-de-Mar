import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import LoginScreen from "./components/Login/LoginScreen";
import DashboardScreen from "./components/Dashboard/DashboardScreen";
import ClientsListScreen from "./components/Clients/ClientsListScreen";
import ClientDetailScreen from "./components/ClientDetail/ClientDetailScreen";
import SimulatorScreen from "./components/Simulator/SimulatorScreen";

export default function App() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);

  if (loading) {
    return <div className="full-screen-center">Cargando...</div>;
  }

  if (!user) {
    return <LoginScreen theme={theme} onToggleTheme={toggleTheme} />;
  }

  const openClient = (client) => {
    setSelectedClient(client);
    setView("clientDetail");
  };

  return (
    <div>
      <nav className="app-nav">
        <button
          className={`nav-btn ${view === "dashboard" ? "active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          Resumen
        </button>
        <button
          className={`nav-btn ${
            view === "clients" || view === "clientDetail" ? "active" : ""
          }`}
          onClick={() => setView("clients")}
        >
          Clientes
        </button>
        <button
          className={`nav-btn ${view === "simulator" ? "active" : ""}`}
          onClick={() => setView("simulator")}
        >
          Simulador
        </button>
        <span className="app-nav-spacer" />
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          aria-label={theme === "light" ? "Modo oscuro" : "Modo claro"}
        >
          {theme === "light" ? "🌙" : "☀️"}
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
