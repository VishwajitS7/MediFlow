"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientSearchProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
}

/** Instant search input that emits a debounced query (name, phone, or patient ID). */
export function PatientSearch({
  onSearch,
  isSearching = false,
  debounceMs = 300,
  placeholder = "Search by name, phone, or patient ID…",
  className,
}: PatientSearchProps) {
  const [value, setValue] = useState("");
  const onSearchRef = useRef(onSearch);
  const isFirstRun = useRef(true);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => onSearchRef.current(value.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search patients"
        maxLength={100}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {isSearching ? (
          <Loader2 className="h-4 w-4 text-teal-400 animate-spin" aria-label="Searching" />
        ) : value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="p-0.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
