import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutGrid,
  MapPin,
  Menu,
  X,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ─── Nav items ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/",       end: true,  icon: LayoutGrid, label: "Dashboard",   badge: null },
  { to: "/assets", end: false, icon: MapPin,      label: "Grid Assets", badge: null },
];

/* ─── Brand ─────────────────────────────────────────────────── */
function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal/20 border border-signal/30 shadow-sm">
        <Zap size={18} className="text-signal-light" />
        {/* live pulse */}
        <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-healthy opacity-60 animate-ping" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-healthy" />
        </span>
      </div>
      <div className="min-w-0">
        <div className="font-display text-[15px] font-semibold leading-none text-white tracking-tight">
          GridVision AI
        </div>
        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.15em] text-sidebar-muted">
          Vision Intelligence Engine
        </div>
      </div>
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────── */
function SidebarSection({ label }) {
  return (
    <div className="mt-2 mb-1 px-5">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-sidebar-muted/60">
        {label}
      </span>
    </div>
  );
}

/* ─── Nav links ──────────────────────────────────────────────── */
function NavLinks({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      <SidebarSection label="Navigation" />
      {NAV_ITEMS.map(({ to, end, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `sidebar-link group relative ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active left-border accent */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-signal-light" />
              )}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                  isActive
                    ? "bg-signal/25 text-signal-light"
                    : "text-sidebar-muted group-hover:text-white group-hover:bg-sidebar-hover"
                }`}
              >
                <Icon size={15} />
              </span>
              <span className={`flex-1 text-sm font-medium leading-none ${isActive ? "text-white" : "text-sidebar-text"}`}>
                {label}
              </span>
              {badge !== null && badge !== undefined && (
                <span className="ml-auto rounded-full bg-signal/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-signal-light">
                  {badge}
                </span>
              )}
              {!isActive && (
                <ChevronRight
                  size={13}
                  className="ml-auto text-sidebar-muted/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ─── Status footer ──────────────────────────────────────────── */
function StatusFooter() {
  return (
    <div className="mt-auto border-t border-sidebar-border px-4 py-4">
      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-healthy opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-healthy" />
          </span>
          <span className="text-[11px] font-mono font-medium text-healthy">
            System Operational
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-sidebar-muted">API Status</span>
            <span className="text-[10px] font-mono text-healthy">Online</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-sidebar-muted">Vision Engine</span>
            <span className="text-[10px] font-mono text-healthy">Ready</span>
          </div>
        </div>
      </div>

      {/* Version tag */}
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-mono text-sidebar-muted/50">GridVision AI</span>
        <span className="text-[10px] font-mono text-sidebar-muted/50">v2.0</span>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────── */
/**
 * Fixed left sidebar on desktop (md+), slide-in drawer on mobile.
 * Same export name as original so App.jsx needs no changes.
 */
export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarContent = (onNavigate) => (
    <>
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <StatusFooter />
    </>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col sidebar-gradient border-r border-sidebar-border md:flex">
        {sidebarContent(undefined)}
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-panel-border bg-panel px-4 shadow-card md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/10 border border-signal/20">
            <Zap size={15} className="text-signal" />
          </div>
          <span className="font-display text-sm font-semibold text-text-primary">
            GridVision AI
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg border border-panel-border p-2 text-text-muted transition-colors hover:border-signal/30 hover:text-signal"
          aria-label="Open navigation menu"
        >
          <Menu size={17} />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative flex h-full w-72 flex-col sidebar-gradient border-r border-sidebar-border shadow-card-hover animate-slideInLeft">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={17} />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
            <StatusFooter />
          </aside>
        </div>
      )}
    </>
  );
}
