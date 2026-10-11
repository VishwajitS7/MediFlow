import { Shield, Users, Calendar, Stethoscope, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  const teamRoles = [
    { title: "Product Owner / Team Lead", desc: "Architecture & Integration Owner", id: "TASK-PO-01", status: "Complete" },
    { title: "Developer 1", desc: "Auth.js, RBAC & Navigation Shell", id: "TASK-DEV1-01", status: "Ready for Review" },
    { title: "Developer 2", desc: "Patient Registration & Directory", id: "TASK-DEV2-01", status: "Ready to Start" },
    { title: "Developer 3", desc: "Appointments, EMR & Prescriptions", id: "TASK-DEV3-01", status: "Planned" },
    { title: "QA Engineer", desc: "Test Strategy, Vitest & E2E Suites", id: "TASK-QA-01", status: "Planned" },
    { title: "Git/GitHub Engineer", desc: "GitFlow & Collaboration Standards", id: "TASK-GIT-01", status: "Planned" },
    { title: "Jenkins Engineer", desc: "CI/CD Pipeline Automation", id: "TASK-CI-01", status: "Planned" },
    { title: "Docker Engineer", desc: "Multi-Stage Containerization", id: "TASK-DOCKER-01", status: "Planned" },
    { title: "Kubernetes Engineer", desc: "Deployments, Services & Ingress", id: "TASK-K8S-01", status: "Planned" },
    { title: "DevOps/SRE Engineer", desc: "Observability, Telemetry & Health", id: "TASK-SRE-01", status: "Planned" },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 flex flex-col gap-12 w-full">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-teal-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Baseline Scaffold Initialized & Approved
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Smart Clinic Management <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">Platform</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Engineered by a collaborative 10-member DevOps engineering team. MediFlow combines Next.js App Router, TypeScript, MongoDB Atlas, and automated CI/CD container delivery.
          </p>
        </div>

        {/* Feature Capabilities Preview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <Shield className="h-6 w-6 text-teal-400" />
            <h3 className="font-semibold text-white">RBAC Authentication</h3>
            <p className="text-xs text-slate-400">Auth.js credential flows for Admins, Doctors, Receptionists, and Patients.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <Users className="h-6 w-6 text-indigo-400" />
            <h3 className="font-semibold text-white">Patient Intake & EMR</h3>
            <p className="text-xs text-slate-400">Comprehensive patient records, medical histories, allergies, and quick search.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <Calendar className="h-6 w-6 text-emerald-400" />
            <h3 className="font-semibold text-white">Scheduling & Queue</h3>
            <p className="text-xs text-slate-400">Outpatient slot booking, appointment lifecycle states, and waiting room queue.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <Stethoscope className="h-6 w-6 text-cyan-400" />
            <h3 className="font-semibold text-white">Clinical & Prescriptions</h3>
            <p className="text-xs text-slate-400">Structured vitals, doctor diagnoses, and digital prescription issuance.</p>
          </div>
        </div>

        {/* 10-Member Team Matrix */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-400" />
              <h2 className="text-xl font-bold text-white">10-Member Engineering Team Alignment</h2>
            </div>
            <span className="text-xs text-slate-400">Source: docs/TEAM_TASKS.md</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {teamRoles.map((role) => (
              <div
                key={role.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-teal-400 font-semibold">{role.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        role.status === "Ready for Review"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {role.status}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-white">{role.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        MediFlow Smart Clinic Platform • Internal DevOps Team Collaboration Baseline
      </footer>
    </div>
  );
}
