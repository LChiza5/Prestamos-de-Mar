import { useRef } from "react";
import { formatMoney } from "../../utils/money";
import { shareOrDownloadImage } from "./generateReceiptImage";
import { ShareIcon, XIcon, BanknoteIcon } from "../icons/Icons";

function formatToday() {
  return new Date().toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ReceiptModal({ clientName, totalDebt, onClose }) {
  const cardRef = useRef(null);
  // Computed at render time (not module load), so it's always the day the
  // comprobante is actually generated - it would've been stuck on the date
  // the app was first opened otherwise, on a session left open past midnight.
  const today = formatToday();

  const handleShare = async () => {
    await shareOrDownloadImage(cardRef.current, `comprobante-${clientName}.png`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="receipt-card" ref={cardRef}>
          <div className="receipt-brand">
            <BanknoteIcon size={22} />
            <span>Préstamos de Mar</span>
          </div>
          <p className="receipt-subtitle">Comprobante de pago</p>

          <div className="receipt-divider" />

          <div className="receipt-row">
            <span className="receipt-label">Cliente</span>
            <span className="receipt-value">{clientName}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Fecha</span>
            <span className="receipt-value">{today}</span>
          </div>

          <div className="receipt-total">
            <span className="receipt-label">Saldo actual</span>
            <strong className="receipt-total-value money-value">
              ₡{formatMoney(totalDebt)}
            </strong>
          </div>

          <div className="receipt-footer">Comprobante generado automáticamente</div>
        </div>

        <button className="btn" onClick={handleShare}>
          <ShareIcon size={18} /> Compartir comprobante
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          <XIcon size={18} /> Cerrar
        </button>
      </div>
    </div>
  );
}
