import Link from "next/link";
import {
  Activity,
  Calendar,
  Pill,
  Server,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import type { AdminDashboardData } from "./types";

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 w-full">
        {/* Admin Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/40 border border-purple-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  System Administration • {data.adminName}
                </h1>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Clinic Administrator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Clinical Governance, Role Management, System Health Observability & Operational Auditing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/register"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition"
            >
              <UserPlus className="h-4 w-4" />
              Add User Account
            </Link>
            <Link
              href="/api/health"
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              Health Telemetry
            </Link>
          </div>
        </div>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Patient Charts</span>
              <Users className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">{data.totalPatients}</div>
            <span className="text-[11px] text-slate-500">Registered in EMR</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Clinical Staff Accounts</span>
              <Stethoscope className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">
              {data.totalDoctors + data.totalReceptionists}
            </div>
            <span className="text-[11px] text-slate-500">
              {data.totalDoctors} Doctors • {data.totalReceptionists} Receptionists
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Today&apos;s Appointments</span>
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{data.todayAppointmentsCount}</div>
            <span className="text-[11px] text-slate-500">Booked across all doctors</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Prescriptions</span>
              <Pill className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">{data.totalPrescriptions}</div>
            <span className="text-[11px] text-slate-500">Issued & audited in system</span>
          </div>
        </div>

        {/* Main 2-Column Administrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Recent Patients & Schedule (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Quick Management Links */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Direct Management Shortcuts</h3>
                <p className="text-xs text-slate-400">Instant access to core clinic modules</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/patients"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  Patients Directory
                </Link>
                <Link
                  href="/appointments"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  Appointments Master
                </Link>
                <Link
                  href="/consultations"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  Doctor Consultations
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition"
                >
                  + Add Staff Account
                </Link>
              </div>
            </div>

            {/* Recent Patients Table */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-400" />
                  Recent Patient Registrations
                </h2>
                <Link href="/patients" className="text-xs text-teal-400 hover:underline">
                  View Full Directory ({data.totalPatients})
                </Link>
              </div>

              {data.recentPatients.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  No patient records created yet.
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                  {data.recentPatients.map((p) => (
                    <div key={p._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                      <div className="flex items-center gap-3.5">
                        <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-mono text-xs font-bold">
                          Rx
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{p.fullName}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {p.patientId} • {p.phone} • {p.email || "No email"}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/patients/${p._id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition shrink-0"
                      >
                        Profile
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Staff Directory & Platform Telemetry */}
          <div className="flex flex-col gap-6">
            {/* Staff Accounts List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  Staff Directory
                </h2>
                <Link href="/register" className="text-xs text-purple-400 hover:underline">
                  + Add Staff
                </Link>
              </div>

              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 divide-y divide-slate-800/60">
                {data.staffList.map((user) => (
                  <div key={user._id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-44">{user.email}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        user.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          : user.role === "DOCTOR"
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                          : user.role === "RECEPTIONIST"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health Status */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                Infrastructure Observability
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    MongoDB Atlas Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Server Framework</span>
                  <span className="font-mono text-slate-200">Next.js 16 (Turbopack)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Security Guard</span>
                  <span className="font-mono text-slate-200">Auth.js RBAC Enforced</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CI/CD Automation</span>
                  <span className="font-mono text-slate-200">Jenkinsfile 7-Stage Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
