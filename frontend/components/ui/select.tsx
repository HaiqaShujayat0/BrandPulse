import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex w-full appearance-none rounded-lg border border-slate-800 bg-slate-900 px-4 pr-8 py-2.5 text-sm text-slate-100 shadow-sm outline-none ring-0 transition-colors focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-muted-foreground">
          ▾
        </span>
      </div>
    );
  }
);

Select.displayName = "Select";

