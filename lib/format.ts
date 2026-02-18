const arabicNumberFormatter = new Intl.NumberFormat("ar");
const gregorianDateFormatter = new Intl.DateTimeFormat(
  "en-CA-u-ca-gregory-nu-latn",
  {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
);
const gregorianTimeFormatter = new Intl.DateTimeFormat("ar-u-ca-gregory", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function getDateObject(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatGregorianDateParts(date: Date) {
  const parts = gregorianDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return null;

  return { year, month, day };
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return arabicNumberFormatter.format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = getDateObject(value);
  if (!date) return "—";

  const parts = formatGregorianDateParts(date);
  if (!parts) return "—";

  return `${parts.year}/${parts.month}/${parts.day}`;
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = getDateObject(value);
  if (!date) return "—";

  return gregorianTimeFormatter.format(date);
}
