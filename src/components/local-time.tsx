"use client";

import { useSyncExternalStore } from "react";
import { DATE_TIME, TIME_ZONE, dateFormat } from "@/lib/dates";

const noSubscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => TIME_ZONE;

/** A date and clock time in the viewer's own time zone ("9 Nov, 4:30 pm"); Australian eastern time until hydrated. */
export function LocalTime({ date }: { date: Date | string }) {
  const zone = useSyncExternalStore(noSubscribe, browserZone, serverZone);
  const d = typeof date === "string" ? new Date(date) : date;
  return <time dateTime={d.toISOString()}>{dateFormat(DATE_TIME, zone).format(d)}</time>;
}
