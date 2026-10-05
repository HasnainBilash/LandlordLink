// Display formatting shared by server and client components. Locale and
// time zone are fixed (not taken from the browser) so server-rendered
// HTML and client hydration always produce the same text.

export const CURRENCY_SYMBOL = "৳";
export const APP_LOCALE = "en-IN"; // lakh grouping: 1,52,000
export const APP_TIME_ZONE = "Asia/Dhaka";

const wholeNumber = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 0,
});

const twoDecimals = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ৳15,000 for whole amounts, ৳15,000.50 when there are paisa.
export function formatMoney(amount: number | string | { toString(): string }) {
  const value = Math.round(Number(amount) * 100) / 100;
  const absolute = Math.abs(value);
  const digits = Number.isInteger(absolute)
    ? wholeNumber.format(absolute)
    : twoDecimals.format(absolute);

  return `${value < 0 ? "-" : ""}${CURRENCY_SYMBOL}${digits}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

// 5 Oct 2026
export function formatDate(date: Date | string) {
  return dateFormatter.format(new Date(date));
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: APP_TIME_ZONE,
});

// 3:42 pm
export function formatTime(date: Date | string) {
  return timeFormatter.format(new Date(date));
}

const dateInputFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: APP_TIME_ZONE,
});

// yyyy-mm-dd in the app time zone, for <input type="date"> values.
export function toDateInputValue(date: Date | string) {
  return dateInputFormatter.format(new Date(date));
}

// Deleted floors and flats keep their rows (for history) but give up
// their number so it can be reused; see lib/tombstone.ts.
export const DELETED_FLOOR_NUMBER_BELOW = -1_000_000;

export function formatFloor(floor: { name: string | null; floorNumber: number }) {
  if (floor.name) return floor.name;
  if (floor.floorNumber <= DELETED_FLOOR_NUMBER_BELOW) return "Removed floor";
  return `Floor ${floor.floorNumber}`;
}

export function formatFlatNumber(flatNumber: string) {
  return flatNumber.split("~")[0];
}

// Natural order: 2 before 10, A9 before A10.
export function compareFlatNumbers(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// "Nusrat Jahan" → "NJ", for avatars.
export function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "?";
}
