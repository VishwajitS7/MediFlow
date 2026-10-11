"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please verify your credentials.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-1">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign In to MediFlow</h1>
          <p className="text-xs text-slate-400">Enter your credentials to access the clinical portal</p>
        </div>

        {/* Demo Fast Fill */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Quick Fill Demo Roles</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo("doctor@mediflow.local")}
              className="text-[11px] py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-left truncate border border-slate-700/40 cursor-pointer"
            >
              🩺 Doctor
            </button>
            <button
              type="button"
              onClick={() => fillDemo("receptionist@mediflow.local")}
              className="text-[11px] py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-left truncate border border-slate-700/40 cursor-pointer"
            >
              📋 Receptionist
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin@mediflow.local")}
              className="text-[11px] py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-left truncate border border-slate-700/40 cursor-pointer"
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("patient@mediflow.local")}
              className="text-[11px] py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-left truncate border border-slate-700/40 cursor-pointer"
            >
              👤 Patient
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mediflow.local"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Clinic</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          Need a clinic account?{" "}
          <Link href="/register" className="text-teal-400 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
