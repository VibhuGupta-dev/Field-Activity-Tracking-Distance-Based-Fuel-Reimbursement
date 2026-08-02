"use client";

import { useState, type ReactNode } from "react";

export interface NavItem {
  id: string;
  label: string;
}

interface AppShellProps {
  eyebrow: string;
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

function HamburgerIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path
        d="M2 4.5H16M2 9H16M2 13.5H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// lg breakpoint in Tailwind is 1024px — only auto-close the sidebar below this
const MOBILE_BREAKPOINT = 1024;

export function AppShell({
  eyebrow,
  navItems,
  activeSection,
  onSectionChange,
  onLogout,
  children,
}: AppShellProps) {
  // starts open on every screen size, per requirement
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSelect = (id: string) => {
    onSectionChange(id);
    const isMobile = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-gray-300 transition hover:border-white/40 hover:text-white active:scale-95"
        >
          <HamburgerIcon />
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          {eyebrow}
        </span>
        <div className="w-9" />
      </header>

      {/* Desktop floating reopen button, only when sidebar is collapsed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="fixed left-4 top-4 z-10 hidden h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-gray-900 text-gray-400 transition hover:border-white/40 hover:text-white hover:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] lg:flex"
        >
          <HamburgerIcon />
        </button>
      )}

      {/* Backdrop, mobile only, closes sidebar on tap */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-gray-950 to-black px-4 py-6 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden items-center justify-between lg:flex">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            {eyebrow}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-gray-500 transition hover:border-white/15 hover:bg-white/5 hover:text-white"
          >
            <HamburgerIcon />
          </button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 lg:mt-8">
          {navItems.map((item) => {
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`group relative rounded-xl px-4 py-2.5 text-left text-[14px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:translate-x-0.5 hover:bg-white/5 hover:text-gray-100"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-white transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                  }`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={onLogout}
          className="mt-auto rounded-xl border border-white/10 px-4 py-2.5 text-[13px] font-medium text-gray-400 transition-all duration-150 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
        >
          Log out
        </button>
      </aside>

      {/* Main content */}
      <main
        className={`min-h-screen flex-1 px-5 py-8 transition-[margin] duration-200 lg:px-10 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}