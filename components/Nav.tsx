"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import SearchModal from "./SearchModal";

export default function Nav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const role = (session as any)?.user?.role as string | undefined;
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  
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
            
            {/* Sign in / Profile Menu */}
            {!isAuthenticated ? (
              <Link
                href="/signin"
                className="h-8 rounded-full border px-3 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Sign In
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="h-8 rounded-full border px-3 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2"
                >
                  <span>{user?.name || user?.email || "Profile"}</span>
                  <span className="text-xs">▼</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded border bg-white dark:bg-zinc-900 shadow-lg z-50">
                    <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
                      <p className="text-sm font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-zinc-500">{user?.email}</p>
                      {role && <p className="text-xs text-zinc-500 capitalize">{role}</p>}
                    </div>
                    {role === "admin" && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => setProfileOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    {(role === "trainer" || role === "admin") && (
                      <Link
                        href="/trainer"
                        className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => setProfileOpen(false)}
                      >
                        Trainer
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: "/" });
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      <SearchModal open={open} onClose={() => setOpen(false)} />
      {/* Close profile menu when clicking outside */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
