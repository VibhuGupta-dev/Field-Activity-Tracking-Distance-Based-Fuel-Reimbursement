"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "sales-associate" | "branch-head";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("sales-associate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
       console.log(res)
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      // Token ab httpOnly cookie mein set ho chuka hai (backend ne response
      // headers mein set kiya). localStorage mein token store nahi karna —
      // JS se access hi nahi ho sakta, aur karna bhi nahi chahiye.
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
         <Link
          href="/"
          className="group mt-4 inline-flex items-center gap-2 text-[13px] text-neutral-500 transition hover:text-neutral-300"
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
        {/* Heading */}
        <h1 className="font-[family-name:var(--font-playfair)] text-[2.75rem] font-medium tracking-[-0.02em] text-white">
          Sign up
        </h1>
        <p className="mt-2 text-[14px] text-neutral-400">
          Field activity tracking for Raha teams
        </p>

        {/* Form — fixed width container */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-300">
              I am a
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] text-white outline-none transition focus:border-neutral-500 [&>option]:bg-black"
            >
              <option value="sales-associate">Sales Associate</option>
              <option value="branch-head">Branch Head</option>
            </select>
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          {/* Sign up */}
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

        {/* Divider — OR (same width as form) */}
        <div className="mt-4 flex w-full max-w-[340px] items-center gap-4">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-[12px] text-neutral-500">OR</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        {/* Go to login (same width as inputs) */}
        <div className="mt-4 w-full max-w-[340px]">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] font-medium text-white transition hover:border-neutral-500 hover:bg-white/5"
          >
            Sign In
          </Link>
        </div>

        {/* Demo hint */}
        <p className="mt-6 max-w-[340px] text-[12px] text-neutral-500">
          Demo: associate1@raha.com / password123
        </p>

       
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