"use client";

import Link from "next/link";
import Image from "next/image";
import Threads from "@/src/components/Threads";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-black">
      {/* Top Banner */}
      <div className="relative z-20 border-b border-neutral-100 bg-gray-200 py-3 text-center text-[13px] text-gray-700">
        Track every field visit • Calculate every km • Built for modern sales
        teams
      </div>

      {/* Navbar */}
      <header className="relative z-30 max-h-20">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-10 py-4 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Field Tracker"
              width={480}
              height={100}
              priority
              className="h-16 md:h-30 w-auto object-fill"
            />
          </Link>

          {/* Right */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hidden text-[15px] text-neutral-600 transition hover:text-black sm:block"
            >
              Sign in
            </Link>

            <Link
              href="/login"
              className="rounded-full bg-black px-6 py-3 text-[14px] font-medium text-white transition hover:bg-neutral-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mt-7 relative z-20 mx-auto flex max-w-6xl flex-col items-center px-6 pt-6 pb-24 text-center md:pt-10">
        
        <h1 className="max-w-3xl font-[family-name:var(--font-roboto-condensed)] text-[3rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-3xl lg:text-[4rem]">
          Track every field visit.

          <br />
          <span className="text-neutral-500 italic">
            Calculate every km.
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-[17px] leading-7 text-neutral-500">
          Log activities, capture live location, and generate monthly fuel
          reimbursement reports — built for sales teams.
        </p>

        {/* Buttons */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-black px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-neutral-800"
          >
            Sign in to Dashboard
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-neutral-100 px-6 py-2.5 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-200"
          >
            View Demo
          </Link>
        </div>
      </main>

      {/* Animated Wave */}
      <div className="pointer-events-none absolute bottom-1 left-0 right-0 z-0 h-[400px] w-full md:h-[480px]">
        <Threads
          color={[0.08, 0.08, 0.08]}
          amplitude={1}
          distance={0}
          enableMouseInteraction
        />
      </div>

      {/* Bottom Section */}
      <div className="relative z-18 mt-7 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl border-t border-neutral-100 px-6 py-8">
          <p className="mb-7 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
            BUILT FOR
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4">
            <span className="text-lg font-semibold text-neutral-900">
              Sales Associates
            </span>

            <span className="text-lg font-semibold text-neutral-900">
              Territory Managers
            </span>
 
            <span className="text-lg font-semibold text-neutral-900">
              HR & Finance
            </span>

            <span className="text-lg font-semibold text-neutral-900">
              Field Teams
            </span>

            <span className="text-lg font-semibold text-neutral-900">
              Operations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}