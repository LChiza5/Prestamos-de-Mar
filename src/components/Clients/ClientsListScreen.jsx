import { useEffect, useState } from "react";
import { createClient, listClients } from "../../services/clientsService";
import { sanitizeText } from "../../utils/sanitize";
import RatingBadge from "./RatingBadge";

export default function ClientsListScreen({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState("green");
  const [loadingData, setLoadingData] = useState(true);

  const refresh = () => listClients().then(setClients);

  useEffect(() => {
    refresh().finally(() => setLoadingData(false));
  }, []);

  const handleAddClient = async () => {
    const safeName = sanitizeText(name);
    if (!safeName) {
      alert("Escribe un nombre válido");
      return;
    }
    await createClient(safeName, rating);
    setName("");
    setRating("green");
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
