// Dates and times. Servers run in UTC, so formatting without a time zone printed "5:30 am" for a quote shared at
// 4:30 pm in Melbourne, and dated anything before 11 am as yesterday. Dates use Australian eastern time (the
// app is for Australian businesses; set NEXT_PUBLIC_TIME_ZONE to change it). Clock times are shown in each
// viewer's own zone by <LocalTime>, which matters in Perth or Brisbane.

export const TIME_ZONE = "Australia/Sydney";

export function dateFormat(options: Intl.DateTimeFormatOptions, timeZone: string = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-AU", { timeZone, ...options });
}

/** "9 Nov, 4:30 pm" */
export const DATE_TIME: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
};

/** Milliseconds `timeZone` is ahead of UTC at the instant `at` (e.g. +11 h in Sydney in summer). */
function zoneOffset(at: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(at)
      .map((p) => [p.type, Number(p.value)]),
  );
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return wall - Math.floor(at / 1000) * 1000;
}

/**
 * Midnight on the 1st of the current month in Australian eastern time, as a real instant. "This month" counted
 * from midnight UTC started the month 10 or 11 hours late in Sydney, so the first morning's work fell into the
 * month before.
 */
export function startOfMonth(now: Date = new Date(), timeZone: string = TIME_ZONE) {
  const local = new Date(now.getTime() + zoneOffset(now.getTime(), timeZone));
  const guess = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  // The offset at midnight on the 1st can differ from today's (daylight saving), so measure it there.
  return new Date(guess - zoneOffset(guess - zoneOffset(guess, timeZone), timeZone));
}
