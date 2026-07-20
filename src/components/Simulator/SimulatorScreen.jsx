import { useState } from "react";
import { simulateLoanPayoff } from "../../services/interestEngine";
import { parseMoney, formatMoney } from "../../utils/money";
import { CalculatorIcon } from "../icons/Icons";

export default function SimulatorScreen() {
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);
  const [paymentText, setPaymentText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = () => {
    const principal = parseMoney(amountText);
    const monthlyPayment = parseMoney(paymentText);

    if (principal <= 0 || monthlyPayment <= 0) {
      setError("Ingresa un monto de préstamo y una cuota mensual válidos");
      setResult(null);
      return;
    }

    try {
      setError("");
      setResult(simulateLoanPayoff(principal, rate, monthlyPayment));
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div className="card">
      <h2>Simulador de cuotas</h2>
      <p className="muted">
        Esta calculadora es solo una estimación, no afecta ningún dato real.
      </p>

      <input
        className="input"
        placeholder="Monto del préstamo"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
      />
      <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
        <option value={6}>6%</option>
        <option value={8}>8%</option>
        <option value={10}>10%</option>
      </select>
      <input
        className="input"
        placeholder="Cuota mensual hipotética"
        value={paymentText}
        onChange={(e) => setPaymentText(e.target.value)}
      />
      <button className="btn" onClick={handleCalculate}>
        <CalculatorIcon size={18} /> Calcular
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="card simulator-result">
          <p className="stat">
            <span>Meses estimados para pagar:</span>
            <strong className="money-value">{result.months}</strong>
          </p>
          <p className="stat">
            <span>Interés total estimado:</span>
            <strong className="money-value">
              ₡{formatMoney(result.totalInterestPaid)}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
