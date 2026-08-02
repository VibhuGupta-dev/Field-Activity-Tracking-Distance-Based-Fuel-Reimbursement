"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentLocation } from "@/src/lib/client/geolocation";
import { AppShell } from "@/src/components/AppShell";
import { RouteTimeline, type RoutePointView } from "@/src/components/RouteTimeline";
import { StatusPill } from "@/src/components/StatusPill";

interface Lead {
  _id: string;
  name: string;
  contact: string;
}

interface ActivityItem {
  _id: string;
  lead: { _id: string; name: string } | string;
  notes: string;
  timestamp: string;
}

interface DaySessionView {
  id: string;
  dateKey: string;
  status: "open" | "closed";
  startTimestamp: string;
  endTimestamp: string | null;
  totalDistanceKm: number | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function leadName(lead: ActivityItem["lead"]): string {
  return typeof lead === "object" ? lead.name : "Lead visit";
}

export default function AssociateDashboard() {
  const router = useRouter();
  const [daySession, setDaySession] = useState<DaySessionView | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadDay = useCallback(async () => {
    const res = await fetch("/api/associate/day");
    if (res.status === 404) {
      setDaySession(null);
      setActivities([]);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setDaySession(data.daySession);
    setActivities(data.activities);
  }, []);

  const loadLeads = useCallback(async () => {
    const res = await fetch("/api/leads");
    if (!res.ok) return;
    const data = await res.json();
    setLeads(data.leads);
  }, []);

  useEffect(() => {
    loadDay();
    loadLeads();
  }, [loadDay, loadLeads]);

  const withLocation = async (
    action: (location: Awaited<ReturnType<typeof getCurrentLocation>>) => Promise<void>
  ) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const location = await getCurrentLocation();
      await action(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleStartDay = () =>
    withLocation(async (location) => {
      const res = await fetch("/api/associate/day/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not start day");
        return;
      }
      setMessage("Day started");
      await loadDay();
    });

  const handleEndDay = () =>
    withLocation(async (location) => {
      const res = await fetch("/api/associate/day/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not end day");
        return;
      }
      setMessage("Day ended");
      await loadDay();
    });

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setError("Select a lead first");
      return;
    }
    if (!notes.trim()) {
      setError("Add meeting notes");
      return;
    }

    await withLocation(async (location) => {
      const res = await fetch("/api/associate/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLeadId, notes, location }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not log activity");
        return;
      }
      setMessage("Visit logged");
      setNotes("");
      setSelectedLeadId("");
      await loadDay();
    });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isOpen = daySession?.status === "open";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const routePoints: RoutePointView[] = daySession
    ? [
        { key: "start", label: "Start", time: formatTime(daySession.startTimestamp), kind: "start" },
        ...activities.map((a) => ({
          key: a._id,
          label: leadName(a.lead),
          time: formatTime(a.timestamp),
          kind: "activity" as const,
        })),
        ...(daySession.endTimestamp
          ? [{ key: "end", label: "End", time: formatTime(daySession.endTimestamp), kind: "end" as const }]
          : []),
      ]
    : [];

  return (
    <AppShell eyebrow="Field Log" onLogout={handleLogout}>
      <p className="text-[13px] text-[var(--color-text-muted)]">{today}</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight">
        Your day
      </h1>

      {error && (
        <p className="mt-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-2.5 text-[13px] text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-2.5 text-[13px] text-[var(--color-success)]">
          {message}
        </p>
      )}

      {/* Status + route */}
      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        {!daySession ? (
          <div className="flex flex-col items-start gap-4">
            <div>
              <p className="text-[14px] font-medium text-[var(--color-text)]">
                No visits logged yet today
              </p>
              <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                Start your day to begin tracking your route.
              </p>
            </div>
            <button
              onClick={handleStartDay}
              disabled={busy}
              className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-[14px] font-semibold text-[var(--color-bg)] transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              {busy ? "Starting…" : "Start day"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <StatusPill status={daySession.status} />
              {isOpen && (
                <button
                  onClick={handleEndDay}
                  disabled={busy}
                  className="rounded-full border border-[var(--color-border)] px-5 py-2 text-[13px] font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  {busy ? "Ending…" : "End day"}
                </button>
              )}
            </div>

            <div className="mt-6">
              <RouteTimeline points={routePoints} distanceKm={daySession.totalDistanceKm} />
            </div>
          </>
        )}
      </section>

      {/* Log a visit — only while day is open */}
      {isOpen && (
        <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Log a visit
          </h2>

          <form onSubmit={handleAddActivity} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-[14px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] [&>option]:bg-[var(--color-surface-raised)]"
              >
                <option value="">Select a lead</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                Meeting notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What was discussed…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-[14px] font-semibold text-[var(--color-bg)] transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              {busy ? "Logging…" : "Log visit"}
            </button>
          </form>
        </section>
      )}

      {/* Visit log */}
      {activities.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Visit log
          </h2>
          <ul className="mt-3 space-y-2.5">
            {activities.map((activity) => (
              <li
                key={activity._id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-medium text-[var(--color-text)]">
                    {leadName(activity.lead)}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11.5px] text-[var(--color-text-muted)]">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">{activity.notes}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
