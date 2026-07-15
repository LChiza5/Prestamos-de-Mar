export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value) {
  const [integerPart, decimalPart] = round2(value).toFixed(2).split(".");
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${withThousands}.${decimalPart}`;
}

export function parseMoney(text) {
  if (!text) return 0;
  const normalized = String(text).replace(/[^\d.]/g, "");
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? 0 : round2(value);
}
