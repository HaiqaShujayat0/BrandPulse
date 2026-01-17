"use client";

import * as React from "react";
import { Sidebar, MobileMenuButton } from "@/components/Sidebar";
import { Globe } from "lucide-react";

export default function SourcesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />
            <Globe size={20} className="text-indigo-400 hidden sm:block" />
            <h1 className="text-base md:text-lg font-semibold">Sources</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center">
            <p className="text-slate-400">Source management coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
