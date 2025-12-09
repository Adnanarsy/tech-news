"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import SearchModal from "./SearchModal";

export default function Nav() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session as any)?.user?.role as string | undefined;
  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800"
        style={{ background: "var(--background)" }}
      >
        <div className="mx-auto max-w-screen-2xl px-4 h-16 flex items-center gap-6">
          <Link href="/" className="font-extrabold tracking-tight text-2xl">N/E</Link>
          <span className="text-xl font-black uppercase tracking-tight">News / Essentials</span>
          <div className="ml-auto flex items-center gap-3">
            {/* Role-aware links */}
            {role === "admin" && (
              <Link
                href="/admin"
                className="hidden md:inline-flex h-8 items-center rounded-full border px-3 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Admin
              </Link>
            )}
            {(role === "trainer" || role === "admin") && (
              <Link
                href="/trainer"
                className="hidden md:inline-flex h-8 items-center rounded-full border px-3 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Trainer
              </Link>
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Search"
              className="h-8 rounded-full border px-3 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Search
            </button>
            <Link
              href="#subscribe"
              className="h-8 rounded-full border px-3 text-sm border-zinc-900 dark:border-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:text-black dark:hover:bg-zinc-100"
            >
              Subscribe
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
