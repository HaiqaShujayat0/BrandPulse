import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 shadow-sm outline-none ring-0 placeholder:text-slate-500 transition-colors focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

