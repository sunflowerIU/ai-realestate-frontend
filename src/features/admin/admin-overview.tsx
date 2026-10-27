"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, UserRoundPlus, UsersRound } from "lucide-react";
import { listRecords, type RecordRow } from "@/lib/api/client";
import { formatBsDate } from "@/lib/formatting/nepal";
import { LoadingIndicator } from "@/features/app/loading-indicator";

export function AdminOverview() {
  const agents = useQuery({ queryKey: ["admin", "agents", "overview"], queryFn: () => listRecords<RecordRow>("admin-agents", { pageSize: 5 }) });
  return <div className="admin-overview"><div className="app-page-heading dash-heading"><div><div className="app-eyebrow">PLATFORM DESK <span>/ {formatBsDate(new Date().toISOString())}</span></div><h1>People behind<br/><em>the platform.</em></h1><p>Manage paid agent access separately from every agent’s private workspace.</p></div><Link className="app-heading-action" href="/admin/agents"><UserRoundPlus size={18}/> Manage agents</Link></div><div className="admin-summary"><div><span>AGENT DIRECTORY</span><strong>{agents.isPending ? "—" : agents.data?.pagination.total ?? "—"}</strong><p>Total agent accounts</p></div><UsersRound size={70} strokeWidth={1}/></div><section className="resource-card admin-recent"><div className="resource-card-top"><span>RECENT AGENTS</span><Link href="/admin/agents">View all <ArrowUpRight size={16}/></Link></div>{agents.error ? <div className="resource-state"><strong>Could not load agents.</strong><button className="app-retry-button" onClick={() => void agents.refetch()}>Try again</button></div> : agents.isPending ? <div className="resource-state"><LoadingIndicator label="Loading agents" /></div> : agents.data?.items.length ? <div className="admin-agent-list">{agents.data.items.map((row) => <div key={row.id}><span className="list-avatar">{String(row.name).slice(0, 1)}</span><strong>{String(row.name)}</strong><span>{String(row.email)}</span><span className={`app-status status-${String(row.status).toLowerCase()}`}>{String(row.status)}</span></div>)}</div> : <div className="resource-state empty"><strong>No agents yet.</strong><p>Create an agent account after arranging payment and access directly.</p></div>}</section><Link className="admin-bottom-link" href="/admin/agents">Open agent management <ArrowRight size={18}/></Link></div>;
}

