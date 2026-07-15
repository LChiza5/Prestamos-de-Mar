const LABELS = { green: "Bueno", yellow: "Más o menos", red: "Malo" };

export default function RatingBadge({ rating }) {
  return (
    <span className={`rating-badge rating-${rating}`}>{LABELS[rating]}</span>
  );
}
