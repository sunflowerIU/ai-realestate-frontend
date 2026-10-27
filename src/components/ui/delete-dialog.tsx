"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Input } from "./input";

type DeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmationText?: string;
  confirmLabel?: string;
  pending?: boolean;
};

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmationText,
  confirmLabel = "Delete",
  pending = false,
}: DeleteDialogProps) {
  const [answer, setAnswer] = useState("");
  const inputId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || (confirmationText && answer !== confirmationText)) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) { if (!next) setAnswer(""); onOpenChange(next); } }}>
      <DialogContent className="delete-dialog" onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
        <div className="delete-dialog-icon" aria-hidden="true"><AlertTriangle size={23} strokeWidth={1.8} /></div>
        <div className="delete-dialog-eyebrow">CONFIRM ACTION</div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <form onSubmit={submit}>
          {confirmationText && (
            <div className="delete-dialog-confirmation">
              <label htmlFor={inputId}>Type <strong>{confirmationText}</strong> to confirm</label>
              <Input id={inputId} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={confirmationText} autoComplete="off" spellCheck={false} disabled={pending} />
            </div>
          )}
          <div className="delete-dialog-actions">
            <button type="button" className="delete-dialog-cancel" onClick={() => { setAnswer(""); onOpenChange(false); }} disabled={pending}>Cancel</button>
            <button type="submit" className="delete-dialog-submit" disabled={pending || Boolean(confirmationText && answer !== confirmationText)}>
              <Trash2 size={16} /> {pending ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
