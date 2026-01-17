"use client";

import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { RefreshCcw, FileDown, Loader2, Menu } from "lucide-react";
import {
  fetchMentions,
  fetchBrandStats,
  fetchAIAnalysis,
  fetchTopics,
  type Mention,
  type BrandStats
} from "@/lib/api";
import { FeedTable } from "@/components/FeedTable";
import { Sidebar, MobileMenuButton } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { AIAnalysis } from "@/components/AIAnalysis";
import { PopularTopics } from "@/components/PopularTopics";
import { BrandSelector } from "@/components/BrandSelector";
import { MessageSquare, CheckCircle2, AlertTriangle, Globe } from "lucide-react";
import { generatePDFReport } from "@/lib/pdfExport";
import { useBrand } from "@/lib/BrandContext";

function useMentions(brandId: string | null, page: number = 1, limit: number = 50) {
  const { data, error, isLoading, mutate } = useSWR(
    brandId ? ["mentions", brandId, page, limit] : null,
    async () => {
      if (!brandId) return { data: [], pagination: null };
      const res = await fetchMentions({
        brandId,
        page,
        limit,
        excludeSpam: true,
        source: "all",
      });
      return res;
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    mentions: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    mutate
  };
}

function useBrandStats(brandId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<BrandStats | null>(
    brandId ? ["stats", brandId] : null,
    () => (brandId ? fetchBrandStats(brandId) : null),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return { stats: data, isLoading, error, mutate };
}

export default function DashboardOverview() {
  const { selectedBrandId, setSelectedBrandId, selectedBrand } = useBrand();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const pageLimit = 50;

  const { mentions: rawMentions, pagination, isLoading, error, mutate: mutateMentions } = useMentions(selectedBrandId, currentPage, pageLimit);
  const { stats, mutate: mutateStats } = useBrandStats(selectedBrandId);
  const { mutate: globalMutate } = useSWRConfig();

  // Mentions are already sorted by relevanceScore from the backend API
  // Backend sorts by: relevanceScore (desc) -> publishedAt (desc)
  // This ensures posts with most keyword matches appear first
  const mentions = rawMentions;

  // Reset to page 1 when brand changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrandId]);

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([mutateMentions(), mutateStats()]);
    setIsRefreshing(false);
  };

  // Handle scrape complete
  const handleScrapeComplete = () => {
    // Refresh all data after scrape
    handleRefresh();
  };

  // Format reach value for display
  const formatReach = (reach: number) => {
    if (reach >= 1000000) return `${(reach / 1000000).toFixed(1)}M`;
    if (reach >= 1000) return `${(reach / 1000).toFixed(1)}K`;
    return reach.toString();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 md:gap-6">
            {/* Mobile menu button */}
            <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />

            <div className="flex items-center gap-2 md:gap-4">
              <h1 className="text-base md:text-lg font-semibold text-slate-100">Dashboard</h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                Live
              </span>
            </div>

            {/* Brand Selector */}
            <div className="hidden md:block h-4 w-[1px] bg-slate-800"></div>
            <div className="hidden sm:block">
              <BrandSelector
                selectedBrandId={selectedBrandId}
                onBrandChange={setSelectedBrandId}
                onScrapeComplete={handleScrapeComplete}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-2"></div>
            <button
              onClick={async () => {
                if (!selectedBrandId || !selectedBrand) return;
                setIsExporting(true);
                setExportError(null);
                try {
                  // Fetch analysis and topics, but don't fail if they error
                  const [analysisRes, topicsRes] = await Promise.allSettled([
                    fetchAIAnalysis(selectedBrandId),
                    fetchTopics(selectedBrandId),
                  ]);

                  const analysis = analysisRes.status === 'fulfilled' ? analysisRes.value?.analysis : null;
                  const topics = topicsRes.status === 'fulfilled' ? topicsRes.value?.topics : [];

                  await generatePDFReport({
                    brandName: selectedBrand.name,
                    generatedAt: new Date().toLocaleString(),
                    stats: stats || {
                      brandId: selectedBrandId,
                      totalMentions: rawMentions.length,
                      avgSentiment: 50,
                      activeCrises: 0,
                      reach: 0,
                      positiveMentions: rawMentions.filter(m => m.sentiment === 'positive').length,
                      negativeMentions: rawMentions.filter(m => m.sentiment === 'negative').length,
                      neutralMentions: rawMentions.filter(m => m.sentiment === 'neutral').length,
                    },
                    mentions: rawMentions,
                    topics: topics || [],
                    analysis: analysis || null,
                  });
                } catch (error) {
                  console.error('Failed to export PDF:', error);
                  setExportError('Failed to generate report. Please try again.');
                  setTimeout(() => setExportError(null), 5000);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={!selectedBrandId || isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown size={14} />
                  Export Report
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Brand Selector */}
        <div className="sm:hidden px-4 py-3 border-b border-slate-800">
          <BrandSelector
            selectedBrandId={selectedBrandId}
            onBrandChange={setSelectedBrandId}
            onScrapeComplete={handleScrapeComplete}
          />
        </div>

        {/* Export Error Toast */}
        {exportError && (
          <div className="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-700 text-red-200 px-4 py-3 rounded-lg shadow-lg text-sm">
            {exportError}
          </div>
        )}

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {/* No Brand Selected Message */}
          {!selectedBrandId && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <div className="text-slate-400 mb-2">No brand selected</div>
              <div className="text-sm text-slate-500">
                Select a brand from the dropdown above to view its mentions and analytics
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-950/30 border border-red-700 p-4 rounded-lg text-sm text-red-200">
              <div className="font-mono mb-2 text-xs uppercase tracking-wider text-red-400">
                API Error
              </div>
              <div>{error instanceof Error ? error.message : "Failed to fetch mentions"}</div>
            </div>
          )}

          {selectedBrandId && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  label="Total Mentions"
                  value={stats?.totalMentions?.toLocaleString() || mentions.length.toLocaleString()}
                  icon={MessageSquare}
                  color="indigo"
                />
                <StatCard
                  label="Avg Sentiment"
                  value={`${stats?.avgSentiment ?? 0}%`}
                  icon={CheckCircle2}
                  color="emerald"
                />
                <StatCard
                  label="Active Crises"
                  value={stats?.activeCrises?.toString() ?? "0"}
                  icon={AlertTriangle}
                  color={stats?.activeCrises ? "rose" : "amber"}
                />
                <StatCard
                  label="Reach"
                  value={formatReach(stats?.reach ?? 0)}
                  icon={Globe}
                  color="orange"
                />
              </div>

              {/* Main Content Area: Feed & Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left: Mentions Feed (2/3 width) */}
                <div className="lg:col-span-2">
                  <FeedTable
                    mentions={mentions}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={setCurrentPage}
                  />
                </div>

                {/* Right: Quick Insights (1/3 width) */}
                <div className="space-y-6">
                  <AIAnalysis brandId={selectedBrandId} />
                  <PopularTopics mentions={mentions} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
