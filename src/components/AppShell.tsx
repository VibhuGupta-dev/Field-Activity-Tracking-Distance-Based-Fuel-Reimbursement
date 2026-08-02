"use client";

import type { ReactNode } from "react";

interface AppShellProps {
  eyebrow: string; // e.g. "FIELD LOG" or "TEAM LEDGER"
  userName?: string;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({ eyebrow, userName, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");

        :root {
          --font-display: "Fraunces", serif;
          --font-body: "Space Grotesk", sans-serif;
          --font-mono: "JetBrains Mono", monospace;

          --color-bg: #10201d;
          --color-surface: #172a26;
          --color-surface-raised: #1f3631;
          --color-border: #2a413c;
          --color-text: #ede6d8;
          --color-text-muted: #8fa39d;
          --color-accent: #e3a23c;
          --color-accent-soft: rgba(227, 162, 60, 0.12);
          --color-success: #6fae8c;
          --color-danger: #d8674f;
        }

        body {
          font-family: var(--font-body);
        }

        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="month"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      {/* Subtle topographic texture — the field's own vernacular, kept quiet */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 15% 20%, transparent 0px, transparent 46px, var(--color-accent) 47px, transparent 48px)",
        }}
      />

      <header className="relative border-b border-[var(--color-border)] px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PinIcon />
            <div>
              <p className="font-[family-name:var(--font-display)] text-[17px] font-semibold leading-none tracking-tight">
                Raha
              </p>
              <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                {eyebrow}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="hidden text-[13px] text-[var(--color-text-muted)] sm:inline">
                {userName}
              </span>
            )}
            <button
              onClick={onLogout}
              className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.32 7.02 11.58a1.5 1.5 0 0 0 1.96 0C13.28 21.32 20 15.25 20 10c0-4.42-3.58-8-8-8Z"
        fill="var(--color-accent)"
      />
      <circle cx="12" cy="10" r="3" fill="var(--color-bg)" />
    </svg>
  );
}
