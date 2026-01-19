const arabicNumberFormatter = new Intl.NumberFormat("ar");
const arabicDateFormatter = new Intl.DateTimeFormat("ar", {
  dateStyle: "medium",
});

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return arabicNumberFormatter.format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return arabicDateFormatter.format(new Date(value));
}
