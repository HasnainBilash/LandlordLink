export function getMonthsBetween(
  start: Date,
  end: Date
): { month: number; year: number }[] {
  const months: { month: number; year: number }[] = [];

  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;

  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ month, year });

    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

export function getRentDueDate(month: number, year: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

// A tenant who joins on the 20th or earlier is charged rent for that
// whole month; joining after the 20th, the first billable month is the
// next one — the join month itself is free.
const LATE_JOIN_GRACE_DAY = 20;

export function getFirstBillableMonth(
  startDate: Date
): { month: number; year: number } {
  let year = startDate.getUTCFullYear();
  let month = startDate.getUTCMonth() + 1;

  if (startDate.getUTCDate() > LATE_JOIN_GRACE_DAY) {
    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { month, year };
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
