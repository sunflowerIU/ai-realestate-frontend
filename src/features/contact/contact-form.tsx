"use client";
/* eslint-disable react/no-children-prop -- TanStack Form fields use render props. */

import { useForm } from "@tanstack/react-form";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema } from "./schema";

export function ContactForm({ email }: { email: string }) {
  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", message: "" },
    validators: { onSubmit: contactSchema },
    onSubmit: ({ value }) => {
      const subject = encodeURIComponent(`Copy Kalam agent access request — ${value.name.trim()}`);
      const body = encodeURIComponent(`Name: ${value.name.trim()}\nEmail: ${value.email.trim()}\nPhone: ${value.phone.trim() || "Not provided"}\n\nAbout my real estate work:\n${value.message.trim()}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  });
  return <form className="entry-form contact-form" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} noValidate>
    <div className="form-grid"><form.Field name="name" children={(field) => <div className="form-field"><label htmlFor="name">Your name</label><Input id="name" placeholder="Your full name" autoComplete="name" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={field.state.meta.errors.length > 0}/>{field.state.meta.errors.length > 0 && <p className="field-error">{field.state.meta.errors.map((e) => typeof e === "string" ? e : e?.message).join(", ")}</p>}</div>}/><form.Field name="email" children={(field) => <div className="form-field"><label htmlFor="contact-email">Email address</label><Input id="contact-email" type="email" autoComplete="email" placeholder="you@example.com" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={field.state.meta.errors.length > 0}/>{field.state.meta.errors.length > 0 && <p className="field-error">{field.state.meta.errors.map((e) => typeof e === "string" ? e : e?.message).join(", ")}</p>}</div>}/></div>
    <form.Field name="phone" children={(field) => <div className="form-field"><label htmlFor="phone">Phone number <span>(optional)</span></label><Input id="phone" type="tel" autoComplete="tel" placeholder="Your phone number" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)}/></div>}/>
    <form.Field name="message" children={(field) => <div className="form-field"><label htmlFor="message">Tell us about your work</label><Textarea id="message" rows={4} placeholder="Where do you work, and what would you like to keep organized?" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={field.state.meta.errors.length > 0}/>{field.state.meta.errors.length > 0 && <p className="field-error">{field.state.meta.errors.map((e) => typeof e === "string" ? e : e?.message).join(", ")}</p>}</div>}/>
    <Button type="submit" className="submit-button">Prepare email <ArrowUpRight size={18}/></Button><p className="form-hint">This opens your email app. Please review and send the message there.</p>
  </form>;
}
