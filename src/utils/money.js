// All money is stored as integer santim (1 ETB = 100 santim).
export function toMinorUnits(amountMajor) {
  const n = Number(amountMajor);
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
}
export function toMajorUnits(amountMinor) {
  return Number(amountMinor) / 100;
}
export function formatMoney(amountMinor, currency = "ETB", locale = "en-ET") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(toMajorUnits(amountMinor));
}
