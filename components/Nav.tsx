"use client";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchModal from "./SearchModal";

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
          <Link href="/" className="font-extrabold tracking-tight text-2xl">N/E</Link>
          <span className="text-xl font-black uppercase tracking-tight">News / Essentials</span>
          <div className="ml-auto flex items-center gap-3">
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
