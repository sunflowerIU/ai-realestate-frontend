"use client";
/* eslint-disable react/no-children-prop -- TanStack Form fields use render props. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { loginSchema } from "./schema";

export function LoginForm() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmitInvalid: () => toast.error("Please correct the highlighted fields."),
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch("/api/session/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
        const result = await response.json() as { error?: unknown; destination?: string };
        if (!response.ok) { toast.error(getApiErrorMessage(result, "Could not sign in. Please try again.")); return; }
        toast.success("Signed in successfully.");
        router.replace(result.destination === "/admin" ? "/admin" : "/workspace");
        router.refresh();
      } catch { toast.error("Unable to connect right now. Check your connection and try again."); }
    }
  });
  return <form className="entry-form" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} noValidate>
    <form.Field name="email" children={(field) => <div className="form-field"><label htmlFor="email">Email address</label><Input id="email" type="email" autoComplete="username" placeholder="you@example.com" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={field.state.meta.errors.length > 0} aria-describedby={field.state.meta.errors.length ? "email-error" : undefined}/>{field.state.meta.errors.length > 0 && <p className="field-error" id="email-error">{field.state.meta.errors.map((e) => typeof e === "string" ? e : e?.message).join(", ")}</p>}</div>} />
    <form.Field name="password" children={(field) => <div className="form-field"><label htmlFor="password">Password</label><div className="password-wrap"><Input id="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={field.state.meta.errors.length > 0} aria-describedby={field.state.meta.errors.length ? "password-error" : undefined}/><button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{field.state.meta.errors.length > 0 && <p className="field-error" id="password-error">{field.state.meta.errors.map((e) => typeof e === "string" ? e : e?.message).join(", ")}</p>}</div>} />
    <form.Subscribe selector={(state) => state.isSubmitting} children={(submitting) => <Button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in to workspace"}<ArrowRight size={18}/></Button>} />
  </form>;
}
