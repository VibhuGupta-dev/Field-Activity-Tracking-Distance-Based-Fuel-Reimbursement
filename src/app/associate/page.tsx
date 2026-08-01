"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentLocation } from "@/src/lib/client/geolocation";

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
      setMessage("Activity logged");
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

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white sm:px-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-playfair)] text-[2rem] font-medium">
            Your day
          </h1>
          <button
            onClick={handleLogout}
            className="text-[13px] text-neutral-400 transition hover:text-neutral-200"
          >
            Logout
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-[13px] text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-2 text-[13px] text-emerald-400">
            {message}
          </p>
        )}

        {/* Status card */}
        <div className="mt-6 rounded-2xl border border-neutral-800 p-5">
          {!daySession && (
            <>
              <p className="text-[14px] text-neutral-400">
                You haven&apos;t started your day yet.
              </p>
              <button
                onClick={handleStartDay}
                disabled={busy}
                className="mt-4 rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60"
              >
                {busy ? "Starting..." : "Start Day"}
              </button>
            </>
          )}

          {daySession && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-400">
                  Status:{" "}
                  <span className={isOpen ? "text-emerald-400" : "text-neutral-300"}>
                    {isOpen ? "In progress" : "Closed"}
                  </span>
                </span>
                {daySession.totalDistanceKm !== null && (
                  <span className="text-[13px] text-neutral-400">
                    {daySession.totalDistanceKm} km
                  </span>
                )}
              </div>
              <p className="mt-2 text-[12px] text-neutral-500">
                Started {new Date(daySession.startTimestamp).toLocaleTimeString()}
                {daySession.endTimestamp &&
                  ` · Ended ${new Date(daySession.endTimestamp).toLocaleTimeString()}`}
              </p>

              {isOpen && (
                <button
                  onClick={handleEndDay}
                  disabled={busy}
                  className="mt-4 rounded-full border border-neutral-700 px-6 py-2.5 text-[14px] font-medium text-white transition hover:border-neutral-500 disabled:opacity-60"
                >
                  {busy ? "Ending..." : "End Day"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Add activity — sirf open day mein dikhta hai */}
        {isOpen && (
          <form
            onSubmit={handleAddActivity}
            className="mt-6 rounded-2xl border border-neutral-800 p-5"
          >
            <h2 className="text-[14px] font-medium text-neutral-200">Log a visit</h2>

            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
                Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white outline-none transition focus:border-neutral-500 [&>option]:bg-black"
              >
                <option value="">Select a lead</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
                Meeting notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What was discussed..."
                className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-neutral-600 outline-none transition focus:border-neutral-500"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60"
            >
              {busy ? "Logging..." : "Log Activity"}
            </button>
          </form>
        )}

        {/* Timeline */}
        <div className="mt-6">
          <h2 className="text-[14px] font-medium text-neutral-200">Timeline</h2>
          <ul className="mt-3 space-y-3">
            {daySession && (
              <li className="rounded-xl border border-neutral-800 px-4 py-3 text-[13px]">
                <span className="text-neutral-400">Start · </span>
                {new Date(daySession.startTimestamp).toLocaleTimeString()}
              </li>
            )}
            {activities.map((activity) => (
              <li
                key={activity._id}
                className="rounded-xl border border-neutral-800 px-4 py-3 text-[13px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">
                    {typeof activity.lead === "object" ? activity.lead.name : "Lead"}
                  </span>
                  <span className="text-neutral-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-neutral-400">{activity.notes}</p>
              </li>
            ))}
            {daySession?.endTimestamp && (
              <li className="rounded-xl border border-neutral-800 px-4 py-3 text-[13px]">
                <span className="text-neutral-400">End · </span>
                {new Date(daySession.endTimestamp).toLocaleTimeString()}
              </li>
            )}
            {!daySession && (
              <p className="text-[13px] text-neutral-500">No activity yet today.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
