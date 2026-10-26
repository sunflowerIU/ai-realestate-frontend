"use client";
/* eslint-disable react/no-children-prop -- TanStack Form fields use render props. */

import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { label, localInputDate } from "@/lib/formatting/nepal";
import type { RecordRow } from "@/lib/api/client";
import type { FieldConfig, ResourceConfig } from "./config";
import { ReferenceInput } from "./reference-input";
import { NepaliDateTimeInput } from "./nepali-datetime-input";

const moneyPattern = /^(?:0|[1-9]\d{0,17})$/;
const decimalPattern = /^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/;

function exactSquareMeters(sqMm: unknown) {
  if (sqMm === null || sqMm === undefined || sqMm === "") return "";
  try {
    const number = BigInt(String(sqMm));
    const whole = number / BigInt(1_000_000);
    const fraction = String(number % BigInt(1_000_000)).padStart(6, "0").replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : String(whole);
  } catch { return ""; }
}

function initialValue(field: FieldConfig, row?: RecordRow) {
  if (!row) return field.kind === "datetime" && ["occurredAt", "visitedAt"].includes(field.key) ? localInputDate(new Date().toISOString()) : "";
  if (field.kind === "datetime") return localInputDate(row[field.key]);
  if (field.kind === "locations") return Array.isArray(row[field.key]) ? (row[field.key] as string[]).join(", ") : "";
  if (field.key === "minLandAreaSqM") return exactSquareMeters(row.minLandAreaSqMm);
  if (field.key === "maxLandAreaSqM") return exactSquareMeters(row.maxLandAreaSqMm);
  if (field.key === "builtUpAreaSqM") return exactSquareMeters(row.builtUpAreaSqMm);
  return row[field.key] === null || row[field.key] === undefined ? "" : String(row[field.key]);
}

function schemaFor(config: ResourceConfig) {
  return z.record(z.string(), z.string()).superRefine((values, ctx) => {
    for (const field of config.fields) {
      const value = values[field.key]?.trim() || "";
      if (field.required && !value) ctx.addIssue({ code: "custom", path: [field.key], message: `${field.label} is required.` });
      if (field.max && value.length > field.max) ctx.addIssue({ code: "custom", path: [field.key], message: `Use ${field.max} characters or fewer.` });
      if (value && field.kind === "email" && !z.email().safeParse(value).success) ctx.addIssue({ code: "custom", path: [field.key], message: "Enter a valid email address." });
      if (value && field.kind === "money" && (!moneyPattern.test(value) || BigInt(value) > BigInt("9223372036854775807"))) ctx.addIssue({ code: "custom", path: [field.key], message: "Enter a whole NPR amount." });
      if (value && field.kind === "decimal" && !decimalPattern.test(value)) ctx.addIssue({ code: "custom", path: [field.key], message: "Enter a positive decimal number." });
      if (value && field.kind === "integer" && (!/^\d+$/.test(value) || Number(value) > 100)) ctx.addIssue({ code: "custom", path: [field.key], message: "Enter a whole number from 0 to 100." });
      if (value && field.kind === "datetime" && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || Number.isNaN(new Date(`${value}:00+05:45`).getTime()))) ctx.addIssue({ code: "custom", path: [field.key], message: "Enter a valid date and time." });
      if (value && field.kind === "locations" && value.split(",").filter(Boolean).length > 20) ctx.addIssue({ code: "custom", path: [field.key], message: "Use no more than 20 locations." });
    }
    if (config.key === "properties" && Boolean(values.landAreaValue) !== Boolean(values.landAreaUnit)) ctx.addIssue({ code: "custom", path: ["landAreaValue"], message: "Enter both a land area and unit." });
    for (const [min, max] of [["minBudgetNpr", "maxBudgetNpr"], ["minLandAreaSqM", "maxLandAreaSqM"]]) {
      if (values[min] && values[max] && Number(values[min]) > Number(values[max])) ctx.addIssue({ code: "custom", path: [max], message: "Maximum must be at least the minimum." });
    }
  });
}

function payloadFor(config: ResourceConfig, values: Record<string, string>, editing: boolean) {
  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = values[field.key]?.trim() ?? "";
    if (field.key === "landAreaValue" || field.key === "landAreaUnit") continue;
    if (editing && config.key === "requirements" && field.key === "clientId") continue;
    if (field.kind === "locations") payload[field.key] = value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
    else if (field.kind === "integer") payload[field.key] = value ? Number(value) : null;
    else if (field.kind === "datetime") payload[field.key] = value ? new Date(`${value}:00+05:45`).toISOString() : null;
    else if (field.kind === "select" && !value) { if (editing) continue; }
    else if (field.kind === "reference" || field.kind === "text" || field.kind === "textarea" || field.kind === "email" || field.kind === "tel" || field.kind === "money" || field.kind === "decimal") payload[field.key] = value || null;
    if (field.kind === "select" && value) payload[field.key] = value;
  }
  if (config.key === "properties") payload.landArea = values.landAreaValue && values.landAreaUnit ? { value: values.landAreaValue.trim(), unit: values.landAreaUnit } : null;
  if (config.key === "notes") payload.type = "NOTE";
  return payload;
}

export function RecordForm({ config, row, onSave, saving, serverError }: { config: ResourceConfig; row?: RecordRow; onSave: (payload: Record<string, unknown>) => void; saving: boolean; serverError: string }) {
  const defaults = useMemo(() => Object.fromEntries(config.fields.map((field) => [field.key, initialValue(field, row)])) as Record<string, string>, [config, row]);
  const schema = useMemo(() => schemaFor(config), [config]);
  const form = useForm({ defaultValues: defaults, validators: { onSubmit: schema }, onSubmit: ({ value }) => onSave(payloadFor(config, value, Boolean(row))) });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} noValidate>
    <div className="record-form-grid">{config.fields.map((field) => <form.Field key={field.key} name={field.key} children={(control) => {
      const error = control.state.meta.errors.map((entry) => typeof entry === "string" ? entry : entry?.message).filter(Boolean).join(" ");
      const id = `field-${field.key}`;
      const disabled = Boolean(row) && config.key === "requirements" && field.key === "clientId";
      return <div className={`form-field ${field.kind === "textarea" || field.kind === "locations" ? "form-wide" : ""}`}><label htmlFor={id}>{field.label}{field.required && <span className="required"> *</span>}</label>{field.kind === "reference" ? <ReferenceInput id={id} resource={field.reference!} value={control.state.value} onBlur={control.handleBlur} onChange={(value) => { control.handleChange(value); if (field.key === "clientId") form.setFieldValue("requirementId", ""); }} disabled={disabled} invalid={Boolean(error)} clientId={field.key === "requirementId" ? form.state.values.clientId : undefined}/> : field.kind === "select" ? <select className="field-input" id={id} value={control.state.value} onBlur={control.handleBlur} onChange={(event) => control.handleChange(event.target.value)} disabled={disabled} aria-invalid={Boolean(error)}><option value="">{field.required ? "Choose an option" : "None / default"}</option>{field.options?.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select> : field.kind === "textarea" ? <Textarea id={id} rows={4} value={control.state.value} onBlur={control.handleBlur} onChange={(event) => control.handleChange(event.target.value)} aria-invalid={Boolean(error)}/> : field.kind === "datetime" ? <NepaliDateTimeInput id={id} value={control.state.value} onBlur={control.handleBlur} onChange={control.handleChange} invalid={Boolean(error)}/> : <Input id={id} type={field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text"} inputMode={field.kind === "money" || field.kind === "decimal" || field.kind === "integer" ? "decimal" : undefined} maxLength={field.max} value={control.state.value} onBlur={control.handleBlur} onChange={(event) => control.handleChange(event.target.value)} aria-invalid={Boolean(error)}/>} {field.hint && <span className="field-hint">{field.hint}</span>}{error && <p className="field-error" role="alert">{error}</p>}</div>;
    }}/>)}</div>
    {serverError && <p className="form-alert" role="alert">{serverError}</p>}
    <div className="record-form-footer"><span>Enter times in Nepal time. Dates display in B.S. after saving.</span><Button disabled={saving} type="submit">{saving ? "Saving…" : row ? "Save changes" : `Add ${config.singular}`}<ArrowRight size={17}/></Button></div>
  </form>;
}
