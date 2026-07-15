export function sanitizeText(text) {
  return text.replace(/[<>/"'`;()]/g, "").trim();
}
