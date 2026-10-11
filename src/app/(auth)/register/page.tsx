"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, User, Mail, Lock, Phone, Stethoscope, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { UserRole } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("PATIENT");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          specialization: role === "DOCTOR" ? specialization : undefined,
          phone: phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to create account. Please check inputs.");
        setLoading(false);
      } else {
        setSuccess("Account registered successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch {
      setError("Network or server error occurred while registering.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-1">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Register Account</h1>
          <p className="text-xs text-slate-400">Join MediFlow Smart Clinic platform</p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Gregory House"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="house@mediflow.local"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500 transition"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="ADMIN">Admin</option>
                <option value="PATIENT">Patient</option>
              </select>
            </div>
          </div>

          {role === "DOCTOR" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Specialization</label>
              <div className="relative">
                <Stethoscope className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Diagnostics, Cardiology"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0100"
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
                <span>Complete Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-teal-400 font-medium hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
