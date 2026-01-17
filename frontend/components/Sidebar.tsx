"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  Settings,
  Briefcase,
  Loader2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
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

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedBrand, isLoading } = useBrand();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleNavClick = (href: string) => {
    router.push(href);
    // Close mobile sidebar after navigation
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles
          "border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col z-50 transition-all duration-300",
          // Desktop: collapsible width
          "hidden md:flex",
          isCollapsed ? "w-16" : "w-64",
          // Mobile: fixed overlay
          isMobileOpen && "!fixed !flex inset-y-0 left-0 w-64"
        )}
      >
        {/* Logo/Brand */}
        <div className={cn(
          "p-4 border-b border-slate-800 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 shrink-0">
              B
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-slate-100">BrandPulse</span>
            )}
          </div>

          {/* Desktop collapse button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Mobile close button */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex mx-auto mt-2 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Navigation */}
        <nav className={cn("flex-1 p-2 space-y-1", isCollapsed && "px-2")}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {item.icon}
                {!isCollapsed && item.name}
              </button>
            );
          })}
        </nav>

        {/* Current Brand Footer */}
        {!isCollapsed && (
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
        )}
      </aside>
    </>
  );
}

// Mobile hamburger button component for use in pages
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
}
