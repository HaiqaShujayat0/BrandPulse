"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "indigo" | "emerald" | "amber" | "rose" | "orange";
  className?: string;
}

const colorStyles = {
  indigo: {
    gradient: "from-indigo-500/20 via-indigo-500/10 to-transparent",
    border: "border-indigo-500/30 hover:border-indigo-400/50",
    icon: "text-indigo-400",
    glow: "shadow-indigo-500/10",
  },
  emerald: {
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-500/30 hover:border-emerald-400/50",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    border: "border-amber-500/30 hover:border-amber-400/50",
    icon: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  rose: {
    gradient: "from-rose-500/20 via-rose-500/10 to-transparent",
    border: "border-rose-500/30 hover:border-rose-400/50",
    icon: "text-rose-400",
    glow: "shadow-rose-500/10",
  },
  orange: {
    gradient: "from-orange-500/20 via-orange-500/10 to-transparent",
    border: "border-orange-500/30 hover:border-orange-400/50",
    icon: "text-orange-400",
    glow: "shadow-orange-500/10",
  },
};

export function StatCard({ label, value, icon: Icon, color = "indigo", className }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-900/80 backdrop-blur-sm border p-5 rounded-xl transition-all duration-300 group hover:scale-[1.02]",
        styles.border,
        `shadow-lg ${styles.glow}`,
        className
      )}
    >
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", styles.gradient)} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
          <div className={cn("p-2 rounded-lg bg-slate-800/50", styles.border)}>
            <Icon size={16} className={styles.icon} />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-100 tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}
