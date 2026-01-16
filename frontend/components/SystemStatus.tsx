"use client";

import * as React from "react";
import { checkBackendHealth } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface SystemStatusProps {
  className?: string;
}

export function SystemStatus({ className }: SystemStatusProps) {
  const [isActive, setIsActive] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    async function checkStatus() {
      setIsChecking(true);
      const healthy = await checkBackendHealth();
      setIsActive(healthy);
      setIsChecking(false);
    }

    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full transition-all",
          isChecking
            ? "animate-pulse bg-yellow-500"
            : isActive
            ? "bg-emerald-500 shadow-lg shadow-emerald-500/50"
            : "bg-red-500"
        )}
      />
      <span className="text-sm text-slate-400">
        <span className="text-slate-100 font-medium">Status:</span>{" "}
        <span
          className={cn(
            "font-medium",
            isChecking
              ? "text-yellow-400"
              : isActive
              ? "text-emerald-400"
              : "text-red-400"
          )}
        >
          {isChecking
            ? "Checking..."
            : isActive
            ? "Active"
            : "Offline"}
        </span>
      </span>
    </div>
  );
}
