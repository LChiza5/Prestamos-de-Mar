import { useEffect, useState } from "react";
import { createClient, listClients } from "../../services/clientsService";
import { createLoan } from "../../services/loansService";
import { sanitizeText } from "../../utils/sanitize";
import { parseMoney } from "../../utils/money";
import RatingBadge from "./RatingBadge";

export default function ClientsListScreen({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState("green");
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);
  const [loadingData, setLoadingData] = useState(true);

  const refresh = () => listClients().then(setClients);

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

    const clientId = await createClient(safeName, rating);
    await createLoan(clientId, principal, rate);

    setName("");
    setRating("green");
    setAmountText("");
    setRate(6);
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
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="green">Bueno</option>
          <option value="yellow">Más o menos</option>
          <option value="red">Malo</option>
        </select>
        <input
          className="input"
          placeholder="Monto del préstamo (ej: 100000.00)"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
        />
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
          <option value={6}>6%</option>
          <option value={8}>8%</option>
          <option value={10}>10%</option>
        </select>
        <button className="btn" onClick={handleAddClient}>
          Agregar cliente
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
        {filtered.length === 0 && (
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
            <span>{client.name}</span>
            <RatingBadge rating={client.rating} />
          </div>
        ))}
      </div>
    </div>
  );
}
