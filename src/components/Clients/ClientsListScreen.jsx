import { useEffect, useState } from "react";
import { createClient, listClients } from "../../services/clientsService";
import { createLoan } from "../../services/loansService";
import { sanitizeText } from "../../utils/sanitize";
import { parseMoney } from "../../utils/money";
import RatingBadge from "./RatingBadge";
import { PlusIcon } from "../icons/Icons";

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function ClientsListScreen({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState("green");
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);
  const [dateText, setDateText] = useState(todayForInput());
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = () =>
    listClients()
      .then((data) => {
        setClients(data);
        setLoadError("");
      })
      .catch((error) => {
        console.error(error);
        setLoadError("No se pudieron cargar los clientes: " + error.message);
      });

  useEffect(() => {
    refresh().finally(() => setLoadingData(false));
  }, []);

  const handleAddClient = async () => {
    const safeName = sanitizeText(name);
    const principal = parseMoney(amountText);

    if (!safeName) {
      alert("Escribe un nombre válido");
      return;
    }
    if (principal <= 0) {
      alert("Ingresa el monto del préstamo inicial");
      return;
    }
    if (!dateText) {
      alert("Selecciona la fecha del préstamo");
      return;
    }

    // Parsed as local midnight, not UTC, so the date picked doesn't shift
    // back a day for timezones behind UTC (e.g. Costa Rica, UTC-6).
    const startDate = new Date(`${dateText}T00:00:00`);
    const clientId = await createClient(safeName, rating);
    await createLoan(clientId, principal, rate, startDate);

    setName("");
    setRating("green");
    setAmountText("");
    setRate(6);
    setDateText(todayForInput());
    refresh();
  };

  if (loadingData) {
    return <p>Cargando clientes...</p>;
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <h3>Agregar cliente</h3>
        <input
          className="input"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="field-label">Calificación del cliente</label>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="green">🟢 Bueno</option>
          <option value="yellow">🟡 Más o menos</option>
          <option value="red">🔴 Malo</option>
        </select>

        <input
          className="input"
          placeholder="Monto del préstamo (ej: 100,000.00)"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
        />

        <label className="field-label">Tasa de interés del préstamo</label>
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
          <option value={6}>6%</option>
          <option value={8}>8%</option>
          <option value={10}>10%</option>
        </select>

        <label className="field-label">Fecha en que se dio el crédito</label>
        <input
          className="input"
          type="date"
          value={dateText}
          onChange={(e) => setDateText(e.target.value)}
        />

        <button className="btn" onClick={handleAddClient}>
          <PlusIcon size={18} /> Agregar cliente
        </button>
      </div>

      <input
        className="input"
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card">
        <h3>Clientes ({filtered.length})</h3>
        {loadError && <p className="error">{loadError}</p>}
        {filtered.length === 0 && !loadError && (
          <p className="muted">
            {clients.length === 0
              ? "Aún no hay clientes. Agrega el primero arriba."
              : "Ningún cliente coincide con la búsqueda."}
          </p>
        )}
        {filtered.map((client) => (
          <div
            key={client.id}
            className="client-row"
            onClick={() => onSelectClient(client)}
          >
            <span className="client-name">{client.name}</span>
            <RatingBadge rating={client.rating} />
          </div>
        ))}
      </div>
    </div>
  );
}
