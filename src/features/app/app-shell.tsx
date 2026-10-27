"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Activity,
  ArrowUpRight,
  Archive,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  FileSpreadsheet,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { toast } from "@/components/ui/toast";
import type { AgentUser } from "@/lib/auth/server";
import { LoadingIndicator } from "./loading-indicator";

const agentNav = [
  { href: "/workspace", label: "Overview", icon: LayoutDashboard },
  { href: "/workspace/clients", label: "Clients & people", icon: UsersRound },
  { href: "/workspace/properties", label: "Properties", icon: Building2 },
  {
    href: "/workspace/requirements",
    label: "Buyer requirements",
    icon: ClipboardList,
  },
  {
    href: "/workspace/activities",
    label: "Activity & follow-ups",
    icon: Activity,
  },
  { href: "/workspace/visits", label: "Property visits", icon: CalendarDays },
  { href: "/workspace/deals", label: "Deals", icon: Handshake },
  { href: "/workspace/notes", label: "Notes", icon: NotebookPen },
  { href: "/workspace/archived", label: "Archived", icon: Archive },
];

async function session() {
  let response = await fetch("/api/session/me", { cache: "no-store" });
  if (response.status === 401)
    response = await fetch("/api/session/refresh", { method: "POST" });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Your session has expired."
        : "Could not verify your session.",
    );
  const result = (await response.json()) as { user: AgentUser };
  return result.user;
}

function ThemeChoice() {
  const { resolvedTheme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, []);
  const dark = ready && resolvedTheme === "dark";
  return (
    <button
      className="app-theme-control"
      type="button"
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Moon size={16} /> : <Sun size={16} />}
      <span>{dark ? "Dark" : "Light"}</span>
      <span className="app-theme-track" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

export function AppShell({
  role,
  children,
}: {
  role: AgentUser["role"];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const {
    data: user,
    isPending,
    error,
    refetch,
  } = useQuery({ queryKey: ["session"], queryFn: session, retry: false });

  useEffect(() => {
    const id = window.setTimeout(
      () =>
        setCollapsed(
          window.localStorage.getItem("copy-kalam-sidebar-collapsed") ===
            "true",
        ),
      0,
    );
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (user && user.role !== role)
      router.replace(user.role === "PLATFORM_ADMIN" ? "/admin" : "/workspace");
    if (error?.message === "Your session has expired.")
      router.replace("/login");
  }, [user, role, error, router]);
  useEffect(() => {
    const listener = () => router.replace("/login");
    window.addEventListener("mero-session-expired", listener);
    return () => window.removeEventListener("mero-session-expired", listener);
  }, [router]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("copy-kalam-sidebar-collapsed", String(next));
  }
  async function signOut() {
    try {
      const response = await fetch("/api/session/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      toast.success("Signed out successfully.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out. Please try again.");
    }
  }

  if (isPending)
    return (
      <div className="app-loading">
        <Brand />
        <LoadingIndicator label="Opening your workspace" />
      </div>
    );
  if (error)
    return (
      <div className="app-loading">
        <Brand />
        <h1>Connection paused</h1>
        <button className="app-retry-button" onClick={() => void refetch()}>
          Try again <ArrowUpRight size={17} />
        </button>
      </div>
    );
  if (!user || user.role !== role)
    return (
      <div className="app-loading">
        <LoadingIndicator label="Redirecting" />
      </div>
    );

  const admin = role === "PLATFORM_ADMIN";
  const nav = admin
    ? [
        { href: "/admin", label: "Overview", icon: ChartNoAxesCombined },
        { href: "/admin/agents", label: "Manage agents", icon: UsersRound },
      ]
    : agentNav;
  const currentPage =
    pathname === "/workspace" || pathname === "/admin"
      ? "Overview"
      : nav.find((item) => item.href === pathname)?.label || "Workspace";

  return (
    <div className={`app-root ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand light />
          <button
            className="sidebar-collapse"
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          <button
            className="sidebar-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-kicker">
          {admin ? "PLATFORM / CONTROL" : "AGENT / WORKSPACE"}
        </div>
        <nav
          className="sidebar-nav"
          aria-label={admin ? "Admin navigation" : "Workspace navigation"}
        >
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={active ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="sidebar-nav-label">{item.label}</span>
                {active && <span className="nav-active-dot" />}
              </Link>
            );
          })}
        </nav>
        {!admin && (
          <div className="sidebar-future">
            <FileSpreadsheet size={20} />
            <strong>Excel imports</strong>
            <span>Planned for a later release</span>
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="sidebar-avatar">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="sidebar-user">
            <strong>{user.name}</strong>
            <span>{admin ? "Platform admin" : "Agent account"}</span>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="app-backdrop"
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="app-content">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              className="app-menu-button"
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="app-breadcrumb">
              {admin ? "PLATFORM ADMIN" : "MY WORKSPACE"}
              <span>/</span>
              <strong>{currentPage}</strong>
            </span>
          </div>
          <div className="app-topbar-right">
            <ThemeChoice />
            <span className="topbar-divider" />
            <span className="topbar-name">{user.name}</span>
            <span className="topbar-avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="app-page">{children}</div>
      </div>
    </div>
  );
}
