"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };
const eventName = "copy-kalam-toast";
let nextId = 0;

export const toast = {
  success(message: string) { show("success", message); },
  error(message: string) { show("error", message); },
};

function show(kind: ToastKind, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastItem>(eventName, {
    detail: { id: ++nextId, kind, message },
  }));
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    function onToast(event: Event) {
      const item = (event as CustomEvent<ToastItem>).detail;
      setItems((current) => [...current.filter((entry) => entry.message !== item.message), item].slice(-4));
      const timer = setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        timers.delete(timer);
      }, item.kind === "error" ? 6500 : 4000);
      timers.add(timer);
    }
    window.addEventListener(eventName, onToast);
    return () => {
      window.removeEventListener(eventName, onToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions" aria-atomic="false">
      {items.map((item) => (
        <div key={item.id} className={`app-toast app-toast-${item.kind}`} role={item.kind === "error" ? "alert" : "status"}>
          <span className="app-toast-icon" aria-hidden="true">{item.kind === "success" ? <Check size={17} /> : <CircleAlert size={17} />}</span>
          <span className="app-toast-message">{item.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
