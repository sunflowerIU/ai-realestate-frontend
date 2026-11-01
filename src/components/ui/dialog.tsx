"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ children, className, overlayClassName, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className={cn("dialog-overlay", overlayClassName)}/><DialogPrimitive.Content className={cn("dialog-content", className)} {...props}>{children}<DialogPrimitive.Close className="dialog-close" aria-label="Close"><X size={19}/></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}
export function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className="dialog-title" {...props}/>; }
export function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className="dialog-description" {...props}/>; }
