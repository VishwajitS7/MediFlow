import { Droplet, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BloodGroupBadge({ bloodGroup, className }: { bloodGroup?: string; className?: string }) {
  if (!bloodGroup) {
    return <span className={cn("text-xs text-slate-600", className)}>—</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono",
        className
      )}
    >
      <Droplet className="h-3 w-3" />
      {bloodGroup}
    </span>
  );
}

export function AllergyPills({
  allergies,
  max,
  emptyLabel = "None recorded",
}: {
  allergies: string[];
  max?: number;
  emptyLabel?: string;
}) {
  if (allergies.length === 0) {
    return <span className="text-xs text-slate-500">{emptyLabel}</span>;
  }
  const visible = max ? allergies.slice(0, max) : allergies;
  const hidden = allergies.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((allergy) => (
        <span
          key={allergy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
        >
          <AlertTriangle className="h-3 w-3" />
          {allergy}
        </span>
      ))}
      {hidden > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
          +{hidden} more
        </span>
      )}
    </div>
  );
}

const GENDER_STYLES: Record<string, string> = {
  MALE: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  FEMALE: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  OTHER: "bg-violet-500/10 text-violet-300 border-violet-500/20",
};

export function GenderBadge({ gender }: { gender: string }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize",
        GENDER_STYLES[gender] ?? "bg-slate-800 text-slate-300 border-slate-700"
      )}
    >
      {gender.toLowerCase()}
    </span>
  );
}
