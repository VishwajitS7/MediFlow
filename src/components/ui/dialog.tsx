"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}

/** Accessible modal built on the native <dialog> element (focus trap + Escape handling for free). */
export function Dialog({ open, title, description, onClose, children, size = "lg" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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
      aria-labelledby={titleId}
      className={`m-auto w-[calc(100%-2rem)] ${size === "md" ? "max-w-xl" : "max-w-3xl"} max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl p-0 backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="flex flex-col max-h-[calc(90vh-2px)]">
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800">
            <div>
              <h2 id={titleId} className="text-lg font-bold text-white">
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
