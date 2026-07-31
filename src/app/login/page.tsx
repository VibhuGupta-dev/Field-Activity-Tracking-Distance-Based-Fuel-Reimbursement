"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      if (data.user.role === "associate") {
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
        {/* Heading */}
        <h1 className="font-[family-name:var(--font-playfair)] text-[2.75rem] font-medium tracking-[-0.02em] text-white">
          Sign in
        </h1>
        <p className="mt-2 text-[14px] text-neutral-400">
          Field activity tracking for Raha teams
        </p>

        {/* Form — fixed width container */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-[340px] space-y-5"
        >
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

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          {/* Sign in + Forgot */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              className="text-[13px] text-neutral-400 transition hover:text-neutral-200"
            >
              Forgot password?
            </button>
          </div>
        </form>

        {/* Divider — OR (same width as form) */}
        <div className="mt-8 flex w-full max-w-[340px] items-center gap-4">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-[12px] text-neutral-500">OR</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        {/* Continue with Google (same width as inputs) */}
        <div className="mt-6 w-full max-w-[340px]">
          <button
            type="button"
            onClick={() => {
              setError("Use email login for demo (associate1@raha.com)");
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-transparent px-4 py-3 text-[14px] font-medium text-white transition hover:border-neutral-500 hover:bg-white/5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Demo hint */}
        <p className="mt-6 max-w-[340px] text-[12px] text-neutral-500">
          Demo: associate1@raha.com / password123
        </p>

        <Link
          href="/"
          className="mt-8 text-[13px] text-neutral-500 transition hover:text-neutral-300"
        >
          ← Back to home
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
            src="https://res.cloudinary.com/domylmj7e/video/upload/v1785533659/598ceb2ff9267a17406666b678982cd8_cnfw25.mp4"
          />
        </div>
      </div>
    </div>
  );
}