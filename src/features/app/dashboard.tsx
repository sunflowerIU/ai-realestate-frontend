"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Handshake,
  Plus,
  UsersRound,
} from "lucide-react";
import { listRecords, type RecordRow } from "@/lib/api/client";
import { formatBsDate, label } from "@/lib/formatting/nepal";
import { LoadingIndicator } from "./loading-indicator";

const stats = [
  {
    key: "clients",
    title: "Clients & people",
    icon: UsersRound,
    href: "/workspace/clients",
  },
  {
    key: "properties",
    title: "Properties",
    icon: Building2,
    href: "/workspace/properties",
  },
  {
    key: "requirements",
    title: "Buyer requirements",
    icon: ClipboardList,
    href: "/workspace/requirements",
  },
  {
    key: "visits",
    title: "Property visits",
    icon: CalendarDays,
    href: "/workspace/visits",
  },
  { key: "deals", title: "Deals", icon: Handshake, href: "/workspace/deals" },
];

export function Dashboard() {
  const counts = useQueries({
    queries: stats.map((stat) => ({
      queryKey: ["dashboard", stat.key],
      queryFn: () => listRecords<RecordRow>(stat.key, { pageSize: 1 }),
    })),
  });
  const followups = useQuery({
    queryKey: ["dashboard", "followups"],
    queryFn: () =>
      listRecords<RecordRow>("activities", {
        pageSize: 5,
        followUpsOnly: "true",
      }),
  });
  const now = formatBsDate(new Date().toISOString());
  return (
    <div className="dashboard">
      <div className="app-page-heading dash-heading">
        <div>
          <div className="app-eyebrow">
            YOUR DESK <span>/ {now}</span>
          </div>
          <h1>
            Your business,
            <br />
            <em>at a glance.</em>
          </h1>
          <p>Keep buyers, properties, and the next conversation in view.</p>
        </div>
        <Link className="app-heading-action" href="/workspace/clients">
          <Plus size={17} /> Open clients
        </Link>
      </div>
      <div className="dashboard-section-caption">
        <span>01 / YOUR WORK AT A GLANCE</span>
        <span>LIVE FROM YOUR PRIVATE RECORDS</span>
      </div>
      <div className="stat-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link className="stat-card" href={stat.href} key={stat.key}>
              <div className="stat-top">
                <Icon size={21} strokeWidth={1.6} />
                <ArrowUpRight size={18} />
              </div>
              {counts[index]?.isPending ? (
                <span
                  className="stat-skeleton"
                  role="status"
                  aria-label={`Loading ${stat.title} count`}
                />
              ) : (
                <strong>{counts[index]?.data?.pagination.total ?? "—"}</strong>
              )}
              <span>{stat.title}</span>
            </Link>
          );
        })}
      </div>
      <div className="dashboard-lower">
        <section className="followup-panel">
          <div className="panel-heading">
            <div>
              <span>02 / STAY IN MOTION</span>
              <h2>Follow-ups on record</h2>
            </div>
            <Link href="/workspace/activities">
              View activity <ArrowRight size={17} />
            </Link>
          </div>
          {followups.isPending ? (
            <div className="panel-empty">
              <LoadingIndicator label="Loading follow-ups" compact />
            </div>
          ) : followups.data?.items.length ? (
            <div className="followup-list">
              {followups.data.items.map((item) => (
                <div className="followup-item" key={item.id}>
                  <span className="followup-icon">
                    <CircleCheck size={18} />
                  </span>
                  <div>
                    <strong>{String(item.notes || "Follow-up")}</strong>
                    <small>
                      {label(item.type)} · {formatBsDate(item.followUpAt, true)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <span>✳</span>
              <strong>No follow-ups recorded yet.</strong>
              <p>
                Log an activity with a follow-up date to keep your next step
                visible.
              </p>
              <Link href="/workspace/activities">
                Add an activity <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
        <aside className="desk-note">
          <span>MATCH DESK / COMING SOON</span>
          <h2>The right record at the right moment.</h2>
          <p>
            We’re building smarter search and matching around the buyer and
            property information you keep here.
          </p>
          <Link href="/workspace/requirements">
            View buyer requirements <ArrowUpRight size={17} />
          </Link>
          <div className="desk-lines" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </aside>
      </div>
    </div>
  );
}
