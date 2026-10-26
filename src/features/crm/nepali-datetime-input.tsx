"use client";

import { useState } from "react";
import { NepaliDate } from "@lacspace/nepali-date";
import { Input } from "@/components/ui/input";

function pad(value: number) { return String(value).padStart(2, "0"); }
function bsForLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return "";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  try { return new NepaliDate(new Date(year, month - 1, day)).toString(); } catch { return ""; }
}

export function NepaliDateTimeInput({ id, value, onChange, onBlur, invalid }: { id: string; value: string; onChange: (value: string) => void; onBlur: () => void; invalid?: boolean }) {
  const [mode, setMode] = useState<"AD" | "BS">("AD");
  const [bsDraft, setBsDraft] = useState("");
  const [error, setError] = useState("");
  const bsValue = bsDraft || bsForLocal(value);
  function convert(valueBs: string, time: string) {
    setBsDraft(valueBs);
    if (!valueBs) { onChange(""); setError(""); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valueBs)) { onChange(valueBs); setError("Use YYYY-MM-DD in B.S."); return; }
    const [year, month, day] = valueBs.split("-").map(Number);
    try {
      const bs = new NepaliDate(year, month, day);
      if (bs.toString() !== valueBs) throw new RangeError("Invalid B.S. date");
      const ad = bs.toAD();
      onChange(`${ad.getFullYear()}-${pad(ad.getMonth() + 1)}-${pad(ad.getDate())}T${time}`);
      setError("");
    } catch { onChange(valueBs); setError("That B.S. date is outside the supported calendar range or invalid."); }
  }
  return <div className="nepali-datetime"><div className="date-mode" role="group" aria-label="Date calendar"><button type="button" className={mode === "AD" ? "selected" : ""} onClick={() => { setMode("AD"); setBsDraft(""); setError(""); }}>A.D.</button><button type="button" className={mode === "BS" ? "selected" : ""} onClick={() => setMode("BS")}>B.S.</button></div>{mode === "AD" ? <Input id={id} type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} aria-invalid={invalid}/> : <div className="bs-date-row"><Input id={id} type="text" inputMode="numeric" placeholder="2083-07-04" value={bsValue} onBlur={onBlur} onChange={(event) => convert(event.target.value, value.slice(11, 16) || "09:00")} aria-invalid={Boolean(error) || invalid}/><Input type="time" aria-label="Nepal time" value={value.slice(11, 16) || "09:00"} onChange={(event) => bsValue && convert(bsValue, event.target.value)} /></div>}{error ? <span className="field-error" role="alert">{error}</span> : value && <span className="field-hint">{mode === "AD" ? `${bsForLocal(value)} B.S.` : `${value.slice(0, 10)} A.D.`} · Nepal time</span>}</div>;
}
