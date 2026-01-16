"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrand } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/Sidebar";

export default function ConfigurationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    searchTerms: "",
    excludedTerms: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const searchTerms = formData.searchTerms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const excludedTerms = formData.excludedTerms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (searchTerms.length === 0) {
        throw new Error("At least one search term is required");
      }

      const brand = await createBrand({
        name: formData.name,
        searchTerms,
        excludedTerms,
      });

      setSuccess(true);
      setFormData({ name: "", searchTerms: "", excludedTerms: "" });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create brand"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-shell flex h-screen overflow-hidden">
      <Sidebar />

      {/* Main Container - flex-1 ensures it takes remaining space after sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Configuration</h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage brands and monitoring settings
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
            >
              ← Back to Dashboard
            </Button>
          </div>
        </header>

        {/* CENTER FIX: flex-1 with items-center centers horizontally */}
        <div className="flex-1 overflow-y-auto bg-slate-950 px-4 py-12 flex flex-col items-center">
          <div className="w-full max-w-xl space-y-6">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Add New Brand</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Configure monitoring keywords and filters
                  </p>
                </div>
              </div>
              <div className="panel-body">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-100"
                    >
                      Brand Name
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., TypeScript, React, Node.js"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="searchTerms"
                      className="block text-sm font-medium text-slate-100"
                    >
                      Keywords to Watch
                    </label>
                    <Input
                      id="searchTerms"
                      value={formData.searchTerms}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, searchTerms: e.target.value })
                      }
                      placeholder="Comma-separated: TypeScript, TS, TSX"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Separate multiple keywords with commas. Mentions containing ANY of these terms will be captured (OR logic).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="excludedTerms"
                      className="block text-sm font-medium text-slate-100"
                    >
                      Negative Keywords
                    </label>
                    <Input
                      id="excludedTerms"
                      value={formData.excludedTerms}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, excludedTerms: e.target.value })
                      }
                      placeholder="Comma-separated: hiring, job, crypto"
                    />
                    <p className="text-xs text-slate-500">
                      Mentions containing ANY of these terms will be excluded (NOT logic).
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-950/10 px-4 py-3">
                      <p className="text-sm font-medium text-red-400">Error</p>
                      <p className="text-xs text-red-400/70 mt-1">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-4 py-3">
                      <p className="text-sm font-medium text-emerald-400">Success</p>
                      <p className="text-xs text-emerald-400/70 mt-1">
                        Brand created successfully! Redirecting to dashboard...
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Creating..." : "Create Brand"}
                  </Button>
                </form>
              </div>
            </div>

            <div className="panel border-indigo-500/20 bg-indigo-950/5">
              <div className="panel-body">
                <h3 className="text-sm font-semibold text-indigo-400 mb-3">
                  How It Works
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-100">Keywords to Watch:</strong> Mentions containing ANY of these terms will be captured (OR logic)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-100">Negative Keywords:</strong> Mentions containing ANY of these terms will be excluded (NOT logic)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>
                      The system will start scraping immediately after creation
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
