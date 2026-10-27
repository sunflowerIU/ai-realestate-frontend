"use client";
/* eslint-disable react/no-children-prop -- TanStack Form fields use render props. */

import { useDeferredValue, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Ban, Check, KeyRound, Plus, Search, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { actionRecord, listRecords, writeRecord, type RecordRow } from "@/lib/api/client";
import { formatBsDate, label } from "@/lib/formatting/nepal";
import { LoadingIndicator } from "@/features/app/loading-indicator";

const schema = z.object({ name: z.string().trim().min(2, "Enter the agent’s name.").max(100), email: z.email("Enter a valid email address.").max(320), password: z.string().min(8, "Use at least 8 characters.").max(128) });

function CreateAgentForm({ onSave, saving }: { onSave: (value: z.infer<typeof schema>) => void; saving: boolean }) {
  const form = useForm({ defaultValues: { name: "", email: "", password: "" }, validators: { onSubmit: schema }, onSubmit: ({ value }) => onSave(value), onSubmitInvalid: () => toast.error("Please correct the highlighted fields.") });
  return <form className="entry-form" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} noValidate>{(["name", "email", "password"] as const).map((name) => <form.Field key={name} name={name} children={(field) => <div className="form-field"><label htmlFor={`agent-${name}`}>{name === "name" ? "Agent name" : name === "email" ? "Email address" : "Initial password"}</label><Input id={`agent-${name}`} type={name === "password" ? "password" : name === "email" ? "email" : "text"} autoComplete="off" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={field.state.meta.errors.length > 0}/>{field.state.meta.errors.length > 0 && <p className="field-error">{field.state.meta.errors.map((error) => typeof error === "string" ? error : error?.message).join(" ")}</p>}</div>}/>)}<p className="field-hint">Create accounts only after arranging payment and access. Share the password with the agent through your own secure channel.</p><Button className="submit-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create agent account"}<ArrowRight size={17}/></Button></form>;
}

export function AgentManagement() {
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim());
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const query = useQuery({ queryKey: ["admin", "agents", page, term, status], queryFn: () => listRecords<RecordRow>("admin-agents", { page, pageSize: 20, search: term || undefined, status: status || undefined }) });
  const create = useMutation({ mutationFn: (value: z.infer<typeof schema>) => writeRecord<RecordRow>("admin-agents", "POST", value), onSuccess: async () => { setOpen(false); toast.success("Agent account created."); await cache.invalidateQueries({ queryKey: ["admin", "agents"] }); }, onError: (error) => toast.error(error.message) });
  const updateStatus = useMutation({ mutationFn: ({ id, action }: { id: string; action: string }) => actionRecord("admin-agents", id, action), onSuccess: async (_data, variables) => { setSelected(null); toast.success(variables.action === "revoke-sessions" ? "Agent sessions revoked." : `Agent ${variables.action === "activate" ? "activated" : variables.action === "suspend" ? "suspended" : "banned"}.`); await cache.invalidateQueries({ queryKey: ["admin", "agents"] }); }, onError: (error) => toast.error(error.message) });
  function statusAction(action: string) {
    if (!selected) return;
    if (["ban", "revoke-sessions"].includes(action) && !window.confirm(action === "ban" ? "Ban this agent and revoke their sessions?" : "Sign this agent out from all sessions?")) return;
    updateStatus.mutate({ id: selected.id, action });
  }
  return <div className="resource-page"><div className="app-page-heading"><div><div className="app-eyebrow">PLATFORM / ACCESS</div><h1>Manage agents<span>.</span></h1><p>Create paid agent accounts and control access. Agent data remains private to each account.</p></div><Button onClick={() => { setOpen(true); }}><Plus size={17}/> Create agent</Button></div><div className="resource-toolbar"><label className="resource-search"><Search size={17}/><span className="sr-only">Search agents</span><Input placeholder="Search agents…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}/></label><div className="toolbar-filters"><label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{["ACTIVE", "SUSPENDED", "BANNED"].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label></div></div><div className="resource-card"><div className="resource-card-top"><span>{query.data?.pagination.total ?? "—"} AGENTS</span><span>PLATFORM ADMIN ONLY</span></div>{query.isPending ? <div className="resource-state"><LoadingIndicator label="Loading agents" /></div> : query.error ? <div className="resource-state"><strong>Could not load agents.</strong><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : query.data?.items.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Agent</th><th>Email</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>{query.data.items.map((agent) => <tr key={agent.id}><td className="agent-name-cell"><span className="list-avatar">{String(agent.name).slice(0, 1)}</span>{String(agent.name)}</td><td>{String(agent.email)}</td><td><span className={`app-status status-${String(agent.status).toLowerCase()}`}>{label(agent.status)}</span></td><td>{formatBsDate(agent.createdAt)}</td><td><button className="table-open" onClick={() => { setSelected(agent); }}>Manage <ArrowRight size={15}/></button></td></tr>)}</tbody></table></div> : <div className="resource-state empty"><strong>No agents found.</strong><p>Try another filter or create the first agent account.</p></div>}<div className="resource-pagination"><span>Page {page} of {Math.max(query.data?.pagination.totalPages || 1, 1)}</span><div><button disabled={page <= 1} aria-label="Previous page" onClick={() => setPage(page - 1)}><ArrowLeft size={18}/></button><button disabled={page >= (query.data?.pagination.totalPages || 1)} aria-label="Next page" onClick={() => setPage(page + 1)}><ArrowRight size={18}/></button></div></div></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="admin-dialog"><div className="dialog-heading"><div className="app-eyebrow">NEW PAID ACCOUNT</div><DialogTitle>Create agent</DialogTitle><DialogDescription>Set up credentials for an agent you have already approved.</DialogDescription></div><CreateAgentForm onSave={(value) => create.mutate(value)} saving={create.isPending}/></DialogContent></Dialog>
    <Dialog open={Boolean(selected)} onOpenChange={(next) => { if (!next) setSelected(null); }}><DialogContent className="admin-dialog"><div className="dialog-heading"><div className="app-eyebrow">ACCOUNT ACCESS</div><DialogTitle>{String(selected?.name || "Agent")}</DialogTitle><DialogDescription>{String(selected?.email || "")}</DialogDescription></div><div className="agent-details"><div><span>Status</span><strong>{label(selected?.status)}</strong></div><div><span>Created</span><strong>{formatBsDate(selected?.createdAt)}</strong></div></div><div className="admin-actions"><button disabled={updateStatus.isPending || selected?.status === "ACTIVE"} onClick={() => statusAction("activate")}><Check size={17}/> Activate</button><button disabled={updateStatus.isPending || selected?.status === "SUSPENDED"} onClick={() => statusAction("suspend")}><ShieldOff size={17}/> Suspend</button><button disabled={updateStatus.isPending || selected?.status === "BANNED"} onClick={() => statusAction("ban")}><Ban size={17}/> Ban</button><button disabled={updateStatus.isPending} onClick={() => statusAction("revoke-sessions")}><KeyRound size={17}/> Revoke sessions</button></div></DialogContent></Dialog>
  </div>;
}

