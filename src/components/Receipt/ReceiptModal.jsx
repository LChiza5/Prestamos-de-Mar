import { useRef } from "react";
import { formatMoney } from "../../utils/money";
import { shareOrDownloadImage } from "./generateReceiptImage";

export default function ReceiptModal({ clientName, totalDebt, onClose }) {
  const cardRef = useRef(null);

  const handleShare = async () => {
    await shareOrDownloadImage(cardRef.current, `comprobante-${clientName}.png`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="receipt-card" ref={cardRef}>
          <h3>Préstamos de Mar</h3>
          <p>{clientName}</p>
          <p className="money-value">
            Deuda actual: ₡{formatMoney(totalDebt)}
          </p>
        </div>

        <button className="btn" onClick={handleShare}>
          📤 Compartir comprobante
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          ✕ Cerrar
        </button>
      </div>
    </div>
  );
}
