import { NepaliDate } from "@lacspace/nepali-date";

export function formatNpr(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  try {
    const digits = BigInt(String(value)).toString();
    const last = digits.slice(-3);
    const first = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `NPR ${first ? `${first},` : ""}${last}`;
  } catch { return String(value); }
}

export function formatBsDate(value: unknown, includeTime = false) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kathmandu", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
    const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
    const bs = new NepaliDate(new Date(part("year"), part("month") - 1, part("day"))).format("D MMMM YYYY");
    if (!includeTime) return `${bs} B.S.`;
    const time = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kathmandu", hour: "numeric", minute: "2-digit" }).format(date);
    return `${bs} B.S. · ${time}`;
  } catch { return new Intl.DateTimeFormat("en-NP", { timeZone: "Asia/Kathmandu", dateStyle: "medium" }).format(date); }
}

export function localInputDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value || "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function label(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}
