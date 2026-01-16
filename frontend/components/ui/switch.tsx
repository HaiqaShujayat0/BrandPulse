import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
        <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-slate-800 bg-slate-900 transition-colors peer-checked:bg-indigo-500 peer-checked:border-indigo-500">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span className="pointer-events-none inline-block h-3.5 w-3.5 translate-x-[3px] rounded-full bg-white transition-transform peer-checked:translate-x-[18px]" />
        </span>
      </label>
    );
  }
);

Switch.displayName = "Switch";

