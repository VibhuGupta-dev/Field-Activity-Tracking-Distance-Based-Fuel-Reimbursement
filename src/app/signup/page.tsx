"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "sales-associate" | "branch-head";

interface BranchHeadOption {
  _id: string;
  name: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("sales-associate");
  const [branchHeadId, setBranchHeadId] = useState("");
  const [branchHeads, setBranchHeads] = useState<BranchHeadOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sirf tab fetch karte hain jab role sales-associate ho — branch-head
  // signup karte waqt is list ki zaroorat hi nahi
  useEffect(() => {
    if (role !== "sales-associate") return;
    fetch("/api/branch-heads")
      .then((res) => res.json())
      .then((data) => setBranchHeads(data.branchHeads ?? []))
      .catch(() => setBranchHeads([]));
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side guard: associate ko koi branch-head zaroor select karna
    // hoga, warna wo kisi bhi team view/search mein kabhi nahi dikhega
    if (role === "sales-associate" && branchHeads.length > 0 && !branchHeadId) {
      setError("Select who you report to");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          ...(role === "sales-associate" && branchHeadId ? { branchHeadId } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "sales-associate") {
        router.push("/associate");
      } else if (data.user.role === "branch-head") {
        router.push("/branch-head");
      } else {
        setError("Unknown role");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Left panel */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[42%] lg:px-16 xl:px-20">
        <h1 className="font-[family-name:var(--font-playfair)] text-[2.75rem] font-medium tracking-[-0.02em] text-white">
          Sign up
        </h1>
        <p className="mt-2 text-[14px] text-neutral-400">
          Field activity tracking for Raha teams
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-[340px] space-y-5"
        >
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-neutral-600 outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-neutral-600 outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-neutral-600 outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
              I am a
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role);
                setBranchHeadId("");
              }}
              className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white outline-none transition focus:border-neutral-500 [&>option]:bg-black"
            >
              <option value="sales-associate">Sales Associate</option>
              <option value="branch-head">Branch Head</option>
            </select>
          </div>

          {/* Sirf associate ke liye — kaunse branch head ko report karega.
              Isse hi search/team view mein wo dikhta hai; bhool jaana
              iska sabse common symptom hai "search kuch nahi dikha raha". */}
          {role === "sales-associate" && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
                Reports to
              </label>
              <select
                value={branchHeadId}
                onChange={(e) => setBranchHeadId(e.target.value)}
                required={branchHeads.length > 0}
                className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white outline-none transition focus:border-neutral-500 [&>option]:bg-black"
              >
                <option value="">
                  {branchHeads.length === 0 ? "No branch heads yet" : "Select a branch head"}
                </option>
                {branchHeads.map((bh) => (
                  <option key={bh._id} value={bh._id}>
                    {bh.name}
                  </option>
                ))}
              </select>
              {branchHeads.length === 0 && (
                <p className="mt-1.5 text-[12px] text-neutral-500">
                  A branch head needs to sign up first.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <div className="flex items-center justify-between gap-4 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Sign up"}
            </button>
          </div>
        </form>

        <div className="mt-8 flex w-full max-w-[340px] items-center gap-4">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-[12px] text-neutral-500">OR</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <div className="mt-6 w-full max-w-[340px]">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] font-medium text-white transition hover:border-neutral-500 hover:bg-white/5"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-6 max-w-[340px] text-[12px] text-neutral-500">
          Demo: associate1@raha.com / password123
        </p>

        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 text-[13px] text-neutral-500 transition hover:text-neutral-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:-translate-x-1"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Right panel — Video */}
      <div className="relative hidden p-6 lg:block lg:w-[58%]">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-neutral-900">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src="https://res.cloudinary.com/domylmj7e/video/upload/v1785594822/74118e6c0ebfd73a7715b7c2aa1fcabf_zmlldh.mp4"
          />
        </div>
      </div>
    </div>
  );
}
