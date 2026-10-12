import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Calendar,
  Lock,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";

export function PublicLanding() {
  const demoAccounts = [
    { role: "Doctor", email: "doctor@mediflow.local", desc: "Clinical console, vitals recording & e-prescriptions", color: "from-teal-500/20 to-emerald-500/10 border-teal-500/30" },
    { role: "Receptionist", email: "receptionist@mediflow.local", desc: "Front desk intake, 30-min slot booking & live queue", color: "from-amber-500/20 to-orange-500/10 border-amber-500/30" },
    { role: "Admin", email: "admin@mediflow.local", desc: "Full operations control, staff provisioning & system health", color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30" },
    { role: "Patient", email: "patient@mediflow.local", desc: "Self-service health portal, visit history & prescriptions", color: "from-sky-500/20 to-blue-500/10 border-sky-500/30" },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-16 flex flex-col gap-16 w-full">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-300">
            <Activity className="h-3.5 w-3.5 text-teal-400" />
            Next-Generation Smart Clinic Management Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Streamlined Healthcare. <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Zero Clinical Friction.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl">
            A unified clinical operating system connecting outpatient reception, doctor consultation workspaces, digital prescriptions, and patient self-service portals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition group"
            >
              Sign In to Clinic Portal
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold text-sm transition"
            >
              Patient Self-Registration
            </Link>
          </div>
        </div>

        {/* Live Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3 hover:border-teal-500/40 transition">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Outpatient Directory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Demographic records, sequential <code className="text-teal-300">MED-YYYY-XXXXX</code> IDs, drug allergy alerts, and instantaneous search.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3 hover:border-indigo-500/40 transition">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Live Waiting Queue</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              30-minute booking slot grid, double-booking clash prevention, daily doctor queue tokens, and auto-refreshing day view.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3 hover:border-cyan-500/40 transition">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Consultation Console</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Doctor visit workspace, physiological vitals with validation, symptoms tracking, diagnosis, and tamper-proof locking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3 hover:border-purple-500/40 transition">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Pill className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white text-base">E-Prescription Studio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured frequency presets, automatic real-time allergy cross-checks, and dedicated printable PDF/paper layouts.
            </p>
          </div>
        </div>

        {/* Fast Role Simulator Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-1">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">Immediate Exploration</span>
            <h2 className="text-2xl font-bold text-white">Experience MediFlow Across All 4 Roles</h2>
            <p className="text-xs text-slate-400">Log in with any synthetic demo account (default password: <code className="text-slate-200">Password123!</code>)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoAccounts.map((item) => (
              <div
                key={item.role}
                className={`p-5 rounded-2xl bg-gradient-to-b ${item.color} border flex flex-col justify-between gap-4`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{item.role}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 text-slate-300 border border-slate-700">Demo</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/40">
                  <div className="text-[11px] font-mono text-slate-400 truncate">{item.email}</div>
                  <Link
                    href={`/login?email=${encodeURIComponent(item.email)}`}
                    className="mt-2 w-full py-1.5 px-3 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-slate-700/80 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition"
                  >
                    <Lock className="h-3 w-3" />
                    Sign In as {item.role}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        MediFlow Smart Clinic Platform • Enterprise Outpatient Healthcare Management
      </footer>
    </div>
  );
}
