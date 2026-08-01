"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TeamActivity {
  _id: string;
  lead: { _id: string; name: string } | string;
  notes: string;
  timestamp: string;
}

interface TeamMember {
  associateId: string;
  associateName: string;
  associateEmail: string;
  status: "not-started" | "open" | "closed";
  totalDistanceKm: number | null;
  activities: TeamActivity[];
}

interface SearchResultDaySession {
  id: string;
  dateKey: string;
  status: string;
  totalDistanceKm: number | null;
  activityCount: number;
}

interface SearchResultAssociate {
  associateId: string;
  associateName: string;
  associateEmail: string;
  history: SearchResultDaySession[];
}

function todayDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export default function BranchHeadDashboard() {
  const router = useRouter();
  const [date, setDate] = useState(todayDateKey());
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultAssociate[] | null>(null);
  const [month, setMonth] = useState(todayDateKey().slice(0, 7));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTeam = useCallback(async (forDate: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/branch-head/team?date=${forDate}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not load team activity");
        return;
      }
      setTeam(data.team);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam(date);
  }, [date, loadTeam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) {
      setSearchResults(null);
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/branch-head/search?name=${encodeURIComponent(searchName)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Search failed");
        return;
      }
      setSearchResults(data.associates);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white sm:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-playfair)] text-[2rem] font-medium">
            Team activity
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

        {/* Date picker */}
        <div className="mt-6 flex items-center gap-3">
          <label className="text-[13px] text-neutral-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-transparent px-3 py-1.5 text-[13px] text-white outline-none focus:border-neutral-500"
          />
        </div>

        {/* Team table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-800">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="px-4 py-3">Associate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Visits</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.associateId} className="border-b border-neutral-900">
                  <td className="px-4 py-3">{member.associateName}</td>
                  <td className="px-4 py-3 capitalize text-neutral-400">
                    {member.status.replace("-", " ")}
                  </td>
                  <td className="px-4 py-3">
                    {member.totalDistanceKm !== null ? `${member.totalDistanceKm} km` : "—"}
                  </td>
                  <td className="px-4 py-3">{member.activities.length}</td>
                </tr>
              ))}
              {team.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Search */}
        <div className="mt-10">
          <h2 className="text-[14px] font-medium text-neutral-200">Search associate</h2>
          <form onSubmit={handleSearch} className="mt-3 flex gap-3">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Associate name"
              className="w-full max-w-xs rounded-xl border border-neutral-700 bg-transparent px-4 py-2.5 text-[14px] text-white placeholder:text-neutral-600 outline-none transition focus:border-neutral-500"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition hover:bg-neutral-200"
            >
              Search
            </button>
          </form>

          {searchResults && (
            <div className="mt-4 space-y-4">
              {searchResults.length === 0 && (
                <p className="text-[13px] text-neutral-500">No matching associate found.</p>
              )}
              {searchResults.map((associate) => (
                <div
                  key={associate.associateId}
                  className="rounded-2xl border border-neutral-800 p-4"
                >
                  <p className="text-[14px] font-medium text-neutral-200">
                    {associate.associateName}
                  </p>
                  <p className="text-[12px] text-neutral-500">{associate.associateEmail}</p>
                  <ul className="mt-3 space-y-2">
                    {associate.history.map((day) => (
                      <li key={day.id} className="flex justify-between text-[13px]">
                        <span className="text-neutral-400">{day.dateKey}</span>
                        <span>
                          {day.totalDistanceKm !== null ? `${day.totalDistanceKm} km` : "—"} ·{" "}
                          {day.activityCount} visits
                        </span>
                      </li>
                    ))}
                    {associate.history.length === 0 && (
                      <p className="text-[13px] text-neutral-500">No history yet.</p>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly export */}
        <div className="mt-10 rounded-2xl border border-neutral-800 p-5">
          <h2 className="text-[14px] font-medium text-neutral-200">Monthly export</h2>
          <p className="mt-1 text-[12px] text-neutral-500">
            Download each associate&apos;s total distance for HR fuel reimbursement.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-transparent px-3 py-1.5 text-[13px] text-white outline-none focus:border-neutral-500"
            />
            <a
              href={`/api/branch-head/export?month=${month}`}
              className="rounded-full border border-neutral-700 px-5 py-2 text-[13px] font-medium text-white transition hover:border-neutral-500"
            >
              Export CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
