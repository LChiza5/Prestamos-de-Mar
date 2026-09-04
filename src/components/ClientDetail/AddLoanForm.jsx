import { useState } from "react";
import { parseMoney } from "../../utils/money";
import { PlusIcon } from "../icons/Icons";

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function AddLoanForm({ onCreateLoan }) {
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);
  const [dateText, setDateText] = useState(todayForInput());

  const handleSubmit = async () => {
    const principal = parseMoney(amountText);
    if (principal <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    if (!dateText) {
      alert("Selecciona la fecha del préstamo");
      return;
    }
    // Parsed as local midnight, not UTC, so the date picked doesn't shift
    // back a day for timezones behind UTC (e.g. Costa Rica, UTC-6).
    const startDate = new Date(`${dateText}T00:00:00`);
    await onCreateLoan(principal, rate, startDate);
    setAmountText("");
    setRate(6);
    setDateText(todayForInput());
  };

  return (
    <div className="card">
      <h3>Nuevo préstamo</h3>
      <input
        className="input"
        placeholder="Monto (ej: 100,000.00)"
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
      <button className="btn" onClick={handleSubmit}>
        <PlusIcon size={18} /> Crear préstamo
      </button>
    </div>
  );
}
