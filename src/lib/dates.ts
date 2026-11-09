// Dates and times. Servers run in UTC, so formatting without a time zone printed "5:30 am" for a quote shared at
// 4:30 pm in Melbourne, and dated anything before 11 am as yesterday. Dates use Australian eastern time (the
// app is for Australian businesses; set NEXT_PUBLIC_TIME_ZONE to change it). Clock times are shown in each
// viewer's own zone by <LocalTime>, which matters in Perth or Brisbane.

export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "Australia/Sydney";

export function dateFormat(options: Intl.DateTimeFormatOptions, timeZone: string = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-AU", { timeZone, ...options });
}

/** "9 Nov, 4:30 pm" */
export const DATE_TIME: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
