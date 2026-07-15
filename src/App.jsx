import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import LoginScreen from "./components/Login/LoginScreen";
import DashboardScreen from "./components/Dashboard/DashboardScreen";
import ClientsListScreen from "./components/Clients/ClientsListScreen";
import ClientDetailScreen from "./components/ClientDetail/ClientDetailScreen";
import SimulatorScreen from "./components/Simulator/SimulatorScreen";
import { SunIcon, MoonIcon, LogOutIcon } from "./components/icons/Icons";

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

  const handleLogout = () => {
    logout();
    setView("dashboard");
    setSelectedClient(null);
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
          Calculadora
        </button>
        <span className="app-nav-spacer" />
        <button
          className="btn-icon theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          aria-label={theme === "light" ? "Modo oscuro" : "Modo claro"}
        >
          {theme === "light" ? (
            <MoonIcon key="moon" className="theme-icon" />
          ) : (
            <SunIcon key="sun" className="theme-icon" />
          )}
        </button>
        <button className="btn btn-danger" onClick={handleLogout} title="Cerrar sesión">
          <LogOutIcon size={18} /> <span className="btn-label">Cerrar sesión</span>
        </button>
      </nav>

      <main className="app-content">
        {view === "dashboard" && <DashboardScreen />}
        {view === "clients" && <ClientsListScreen onSelectClient={openClient} />}
        {view === "clientDetail" && selectedClient && (
          <ClientDetailScreen
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            onBack={() => setView("clients")}
          />
        )}
        {view === "simulator" && <SimulatorScreen />}
      </main>
    </div>
  );
}
