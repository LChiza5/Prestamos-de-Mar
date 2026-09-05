import { useEffect, useState } from "react";
import { createClient, listClients } from "../../services/clientsService";
import { createLoan, listAllLoans } from "../../services/loansService";
import { sanitizeText } from "../../utils/sanitize";
import { parseMoney } from "../../utils/money";
import RatingBadge from "./RatingBadge";
import { PlusIcon, CalendarIcon } from "../icons/Icons";

const STALE_DAYS_THRESHOLD = 30;

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function daysSince(dateValue) {
  if (!dateValue) return null;
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ClientsListScreen({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState("green");
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);
  const [dateText, setDateText] = useState(todayForInput());
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = () =>
    Promise.all([listClients(), listAllLoans()])
      .then(([clientsData, loansData]) => {
        setClients(clientsData);
        setLoans(loansData);
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
    const safePhone = sanitizeText(phone);
    const clientId = await createClient(safeName, rating, safePhone);
    await createLoan(clientId, principal, rate, startDate);

    setName("");
    setPhone("");
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

  // Oldest "last activity" among a client's active loans - the one that's
  // been waiting longest for an abono is the one worth flagging.
  function staleDaysFor(clientId) {
    const activeLoans = loans.filter(
      (loan) => loan.clientId === clientId && loan.status === "active"
    );
    if (activeLoans.length === 0) return null;
    const days = activeLoans.map((loan) =>
      daysSince(loan.lastActivityDate ?? loan.startDate)
    );
    return Math.max(...days);
  }

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

        <input
          className="input"
          type="tel"
          placeholder="Teléfono (opcional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
        <div className="input-icon-wrap">
          <CalendarIcon className="input-icon" />
          <input
            className="input input-with-icon"
            type="date"
            value={dateText}
            onChange={(e) => setDateText(e.target.value)}
          />
        </div>

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
        {filtered.map((client) => {
          const staleDays = staleDaysFor(client.id);
          const isStale = staleDays !== null && staleDays >= STALE_DAYS_THRESHOLD;
          return (
            <div
              key={client.id}
              className="client-row"
              onClick={() => onSelectClient(client)}
            >
              <span className="client-name">{client.name}</span>
              {isStale && (
                <span
                  className="stale-badge"
                  title={`${staleDays} días sin abonar`}
                >
                  {staleDays}d sin abonar
                </span>
              )}
              <RatingBadge rating={client.rating} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
