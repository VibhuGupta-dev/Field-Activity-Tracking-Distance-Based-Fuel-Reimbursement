"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@/src/components/AppShell";
import { LocationPicker } from "@/src/components/LocationPicker";
import { StatusPill, type SessionStatus } from "@/src/components/StatusPill";

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
  status: SessionStatus;
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

const NAV_ITEMS: NavItem[] = [
  { id: "team", label: "Team" },
  { id: "search", label: "Find Associate" },
  { id: "export", label: "Export" },
  { id: "addLead", label: "Add Lead" },
];

function todayDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export default function BranchHeadDashboard() {
  const router = useRouter();
  const [section, setSection] = useState("team");
  const [date, setDate] = useState(todayDateKey());
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadLat, setLeadLat] = useState("");
  const [leadLng, setLeadLng] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadError, setLeadError] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultAssociate[] | null>(null);
  const [month, setMonth] = useState(todayDateKey().slice(0, 7));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadTeam = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`/api/branch-head/team?date=${date}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.message || "Could not load team activity");
          return;
        }
        setTeam(data.team);
      } catch {
        if (!active) return;
        setError("Something went wrong. Please try again.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTeam();

    return () => {
      active = false;
    };
  }, [date]);

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

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError("");
    setLeadMessage("");

    const lat = parseFloat(leadLat);
    const lng = parseFloat(leadLng);

    if (!leadName.trim() || !leadContact.trim()) {
      setLeadError("Name and contact are required");
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setLeadError("Enter valid latitude and longitude");
      return;
    }

    setLeadSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          contact: leadContact,
          location: { lat, lng },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeadError(data.message || "Could not add lead");
        return;
      }
      setLeadMessage(`${data.lead.name} added`);
      setLeadName("");
      setLeadContact("");
      setLeadLat("");
      setLeadLng("");
    } catch {
      setLeadError("Something went wrong. Please try again.");
    } finally {
      setLeadSaving(false);
    }
  };

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell
      eyebrow="Team Ledger"
      navItems={NAV_ITEMS}
      activeSection={section}
      onSectionChange={setSection}
      onLogout={handleLogout}
    >
      {error && (
        <p className="mb-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-2.5 text-[13px] text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {/* ---------------- TEAM ---------------- */}
      {section === "team" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] text-[var(--color-text-muted)]">Reviewing</p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight">
                {dateLabel}
              </h1>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-[var(--color-border)] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              <span>Associate</span>
              <span>Status</span>
              <span className="text-right">Distance</span>
              <span className="text-right">Visits</span>
            </div>
            {team.map((member) => (
              <div
                key={member.associateId}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-[var(--color-border)] px-5 py-3.5 text-[13.5px] last:border-b-0 hover:bg-[var(--color-surface-raised)]"
              >
                <div>
                  <p className="font-medium text-[var(--color-text)]">{member.associateName}</p>
                  <p className="text-[11.5px] text-[var(--color-text-muted)]">{member.associateEmail}</p>
                </div>
                <StatusPill status={member.status} />
                <span className="text-right font-[family-name:var(--font-mono)] text-[13.5px]">
                  {member.totalDistanceKm !== null ? `${member.totalDistanceKm} km` : "—"}
                </span>
                <span className="text-right font-[family-name:var(--font-mono)] text-[13.5px] text-[var(--color-text-muted)]">
                  {member.activities.length}
                </span>
              </div>
            ))}
            {team.length === 0 && !loading && (
              <p className="px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
                No associates assigned to you yet.
              </p>
            )}
          </section>
        </>
      )}

      {/* ---------------- FIND ASSOCIATE ---------------- */}
      {section === "search" && (
        <>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight">
            Find associate
          </h1>
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Associate name"
              className="w-full max-w-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-bg)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Search
            </button>
          </form>

          {searchResults && (
            <div className="mt-4 space-y-3">
              {searchResults.length === 0 && (
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  No associate matches &ldquo;{searchName}&rdquo;.
                </p>
              )}
              {searchResults.map((associate) => (
                <div
                  key={associate.associateId}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                >
                  <p className="text-[14px] font-medium text-[var(--color-text)]">
                    {associate.associateName}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {associate.associateEmail}
                  </p>
                  <ul className="mt-3 divide-y divide-[var(--color-border)]">
                    {associate.history.map((day) => (
                      <li key={day.id} className="flex justify-between py-2 text-[13px]">
                        <span className="text-[var(--color-text-muted)]">{day.dateKey}</span>
                        <span className="font-[family-name:var(--font-mono)]">
                          {day.totalDistanceKm !== null ? `${day.totalDistanceKm} km` : "—"}
                          <span className="ml-2 text-[var(--color-text-muted)]">
                            {day.activityCount} visits
                          </span>
                        </span>
                      </li>
                    ))}
                    {associate.history.length === 0 && (
                      <p className="py-2 text-[13px] text-[var(--color-text-muted)]">
                        No history yet.
                      </p>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- EXPORT ---------------- */}
      {section === "export" && (
        <>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight">
            Monthly reimbursement export
          </h1>
          <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Download each associate&apos;s total distance for HR fuel reimbursement.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[13px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              />
              <a
                href={`/api/branch-head/export?month=${month}`}
                className="rounded-full border border-[var(--color-accent)] px-5 py-2 text-[13px] font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Download CSV
              </a>
            </div>
          </section>
        </>
      )}

      {/* ---------------- ADD LEAD ---------------- */}
      {section === "addLead" && (
        <>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight">
            Add a lead
          </h1>
          <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              New clients your associates can log visits against.
            </p>

            {leadError && (
              <p className="mt-3 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-2.5 text-[13px] text-[var(--color-danger)]">
                {leadError}
              </p>
            )}
            {leadMessage && (
              <p className="mt-3 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-2.5 text-[13px] text-[var(--color-success)]">
                {leadMessage}
              </p>
            )}

            <form onSubmit={handleAddLead} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                  Lead name
                </label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Kavita Textiles"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                  Contact
                </label>
                <input
                  type="text"
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  placeholder="Phone or email"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                  Location
                </label>
                <LocationPicker
                  lat={leadLat ? parseFloat(leadLat) : null}
                  lng={leadLng ? parseFloat(leadLng) : null}
                  onChange={(lat, lng) => {
                    setLeadLat(lat.toFixed(6));
                    setLeadLng(lng.toFixed(6));
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                  Latitude
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={leadLat}
                  onChange={(e) => setLeadLat(e.target.value)}
                  placeholder="17.4483"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--color-text-muted)]">
                  Longitude
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={leadLng}
                  onChange={(e) => setLeadLng(e.target.value)}
                  placeholder="78.3915"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={leadSaving}
                  className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-[14px] font-semibold text-[var(--color-bg)] transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  {leadSaving ? "Adding…" : "Add lead"}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </AppShell>
  );
}