"use client";

export type SessionStatus = "not-started" | "open" | "closed";

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string }> = {
  "not-started": { label: "Not started", color: "var(--color-text-muted)" },
  open: { label: "Active", color: "var(--color-accent)" },
  closed: { label: "Closed", color: "var(--color-success)" },
};

export function StatusPill({ status }: { status: SessionStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
      style={{ borderColor: config.color, color: config.color }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "open" ? "animate-pulse" : ""}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
