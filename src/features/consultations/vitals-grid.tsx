import { Gauge, HeartPulse, Ruler, Thermometer, Weight, Wind } from "lucide-react";
import type { IVitals } from "@/types";
import { cn } from "@/lib/utils";
import { calculateBmi } from "@/features/consultations/vitals-utils";

/** Read-only vitals tiles. Missing values render as an em dash. */
export function VitalsGrid({ vitals, compact = false }: { vitals?: IVitals; compact?: boolean }) {
  const v = vitals ?? {};
  const bp =
    v.bloodPressureSystolic !== undefined && v.bloodPressureDiastolic !== undefined
      ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
      : undefined;
  const bmi = calculateBmi(v.weight, v.height);

  const tiles = [
    { label: "Blood Pressure", value: bp, unit: "mmHg", icon: <Gauge className="h-4 w-4 text-rose-400" /> },
    { label: "Heart Rate", value: v.heartRate, unit: "bpm", icon: <HeartPulse className="h-4 w-4 text-pink-400" /> },
    { label: "Temperature", value: v.temperature, unit: "°F", icon: <Thermometer className="h-4 w-4 text-amber-400" /> },
    { label: "SpO₂", value: v.spo2, unit: "%", icon: <Wind className="h-4 w-4 text-sky-400" /> },
    { label: "Weight", value: v.weight, unit: "kg", icon: <Weight className="h-4 w-4 text-indigo-400" /> },
    {
      label: "Height",
      value: v.height,
      unit: bmi ? `cm · BMI ${bmi}` : "cm",
      icon: <Ruler className="h-4 w-4 text-teal-400" />,
    },
  ];

  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6")}>
      {tiles.map((t) => (
        <div key={t.label} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {t.icon}
            {t.label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-lg font-bold tabular-nums", t.value === undefined ? "text-slate-600" : "text-white")}>
              {t.value ?? "—"}
            </span>
            <span className="text-[11px] text-slate-500">{t.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
