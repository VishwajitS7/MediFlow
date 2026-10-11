"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface PatientDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Accessible modal built on the native <dialog> element (focus trap + Escape handling for free). */
export function PatientDialog({ open, title, description, onClose, children }: PatientDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="patient-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl p-0 backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="flex flex-col max-h-[90vh]">
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800">
            <div>
              <h2 id="patient-dialog-title" className="text-lg font-bold text-white">
                {title}
              </h2>
              {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
