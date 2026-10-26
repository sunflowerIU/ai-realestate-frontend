"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { getRecord, listRecords, type RecordRow } from "@/lib/api/client";

type Reference = "clients" | "properties" | "requirements";

function nameFor(row: RecordRow, resource: Reference) { return String(row[resource === "clients" ? "name" : "title"] || `Record ${row.id.slice(0, 8)}`); }

export function ReferenceInput({ id, resource, value, onChange, onBlur, disabled, invalid, clientId }: { id: string; resource: Reference; value: string; onChange: (value: string) => void; onBlur: () => void; disabled?: boolean; invalid?: boolean; clientId?: string }) {
  const [search, setSearch] = useState("");
  const options = useQuery({ queryKey: ["reference", resource, search.trim(), clientId], queryFn: () => listRecords<RecordRow>(resource, { pageSize: 50, search: search.trim() || undefined, ...(resource === "requirements" && clientId ? { clientId } : {}) }), enabled: !disabled });
  const current = useQuery({ queryKey: ["reference", resource, "selected", value], queryFn: () => getRecord<RecordRow>(resource, value), enabled: Boolean(value) && !options.data?.items.some((item) => item.id === value) });
  const list = options.data?.items || [];
  return <div className="reference-input"><Input type="search" placeholder={`Search ${resource}…`} value={search} onChange={(event) => setSearch(event.target.value)} disabled={disabled} aria-label={`Search ${resource}`}/><select className="field-input" id={id} value={value} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-invalid={invalid}><option value="">Choose {resource === "clients" ? "a person" : resource === "properties" ? "a property" : "a requirement"}</option>{list.map((row) => <option key={row.id} value={row.id}>{nameFor(row, resource)}</option>)}{value && !list.some((row) => row.id === value) && <option value={value}>{current.data ? nameFor(current.data, resource) : `Current record ${value.slice(0, 8)}`}</option>}</select>{search && options.data?.pagination.total && options.data.pagination.total > 50 && <span className="field-hint">Showing the first 50 matches. Refine your search to find a specific record.</span>}{options.error && <span className="field-error">Could not search records.</span>}</div>;
}
