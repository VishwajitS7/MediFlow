"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Activity, Shield, LogOut, LogIn, UserPlus } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "DOCTOR":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      case "RECEPTIONIST":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "PATIENT":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 lg:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                Medi<span className="text-teal-400">Flow</span>
              </span>
              <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                v0.1.0
              </span>
            </div>
          </Link>

          {/* Role-Specific Navigation Links */}
          {session?.user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium min-w-0 overflow-x-auto [scrollbar-width:none]">
              <Link
                href="/"
                className="px-2 lg:px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
              >
                Dashboard
              </Link>
              {["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role) && (
                <Link
                  href="/patients"
                  className="px-2 lg:px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Patients
                </Link>
              )}
              {["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(session.user.role) && (
                <Link
                  href="/appointments"
                  className="px-2 lg:px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Appointments
                </Link>
              )}
              {["ADMIN", "DOCTOR"].includes(session.user.role) && (
                <Link
                  href="/consultations"
                  className="px-2 lg:px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Consultations
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link
                  href="/register"
                  className="px-2 lg:px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Add User
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* User Session / Auth Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/api/health"
            target="_blank"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Health</span>
          </Link>

          {status === "loading" ? (
            <div className="h-8 w-20 bg-slate-800 animate-pulse rounded-lg" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <Shield className="h-4 w-4 text-teal-400" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight whitespace-nowrap truncate max-w-36">
                    {session.user.name || session.user.email}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border w-fit mt-0.5 ${getRoleBadgeColor(
                      session.user.role
                    )}`}
                  >
                    {session.user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition border border-slate-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold shadow-md shadow-teal-500/20 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
