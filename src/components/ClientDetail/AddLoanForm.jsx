import { useState } from "react";
import { parseMoney } from "../../utils/money";
import { PlusIcon } from "../icons/Icons";

export default function AddLoanForm({ onCreateLoan }) {
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);

  const handleSubmit = async () => {
    const principal = parseMoney(amountText);
    if (principal <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    await onCreateLoan(principal, rate);
    setAmountText("");
    setRate(6);
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
      <button className="btn" onClick={handleSubmit}>
        <PlusIcon size={18} /> Crear préstamo
      </button>
    </div>
  );
}
