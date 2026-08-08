import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Activity, Map, LayoutGrid, Menu, X } from "lucide-react";

const linkBase =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors";
const linkActive = "bg-signal/10 text-signal border-l-2 border-signal -ml-0.5 pl-[11px]";
const linkInactive =
  "text-text-muted border-l-2 border-transparent -ml-0.5 pl-[11px] hover:text-text-primary hover:bg-elevated";

function Brand() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-signal/30 bg-signal/10">
        <Activity className="text-signal" size={18} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-healthy animate-pulseDot ring-2 ring-panel" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[15px] font-semibold leading-none tracking-tight text-text-primary">
          GridVision AI
        </div>
        <div className="label-eyebrow mt-1 truncate">Vision Intelligence Engine</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
      >
        <LayoutGrid size={17} />
        Dashboard
      </NavLink>
      <NavLink
        to="/assets"
        onClick={onNavigate}
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
      >
        <Map size={17} />
        Assets
      </NavLink>
    </nav>
  );
}

function StatusFooter() {
  return (
    <div className="mt-auto border-t border-line px-4 py-4">
      <div className="flex items-center gap-2 rounded-md bg-elevated px-3 py-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-healthy opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-healthy" />
        </span>
        <span className="text-[11px] font-mono text-text-muted">
          Engine <span className="text-healthy">Operational</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Left sidebar navigation. Fixed on desktop (md+), collapses to a slide-in
 * drawer behind a compact top bar on mobile. Same component name/export as
 * the original top navbar, so App.jsx and the rest of the app need no
 * other changes.
 */
export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop: fixed left sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-panel md:flex">
        <Brand />
        <NavLinks />
        <StatusFooter />
      </aside>

      {/* Mobile: compact top bar with hamburger trigger */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-panel px-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-signal/30 bg-signal/10">
            <Activity className="text-signal" size={16} />
          </div>
          <span className="font-display text-sm font-semibold text-text-primary">
            GridVision AI
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-md border border-line p-2 text-text-muted transition-colors hover:text-signal"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Mobile: slide-in drawer + backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-panel shadow-panel">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="mr-3 rounded-md p-2 text-text-muted hover:text-signal"
                aria-label="Close navigation menu"
              >
                <X size={18} />
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
