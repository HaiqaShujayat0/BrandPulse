"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  Settings,
  Briefcase,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/lib/BrandContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { name: "Analytics", href: "/analytics", icon: <BarChart3 size={18} /> },
  { name: "Portfolio", href: "/portfolio", icon: <Briefcase size={18} /> },
  { name: "Sources", href: "/sources", icon: <Globe size={18} /> },
  { name: "Configuration", href: "/config", icon: <Settings size={18} /> },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedBrand, isLoading } = useBrand();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
          B
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-100">BrandPulse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              {item.icon}
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Current Brand Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-xl p-4 border border-slate-700/50 shadow-lg">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Current Brand</p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
          ) : selectedBrand ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-semibold text-slate-100 truncate">{selectedBrand.name}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Select a Brand</p>
          )}
        </div>
      </div>
    </aside>
  );
}
