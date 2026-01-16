"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { SentimentPieChart } from "@/components/SentimentPieChart";
import { SourceBarChart } from "@/components/SourceBarChart";
import { useBrand } from "@/lib/BrandContext";
import {
  fetchBrandStats,
  fetchMentions,
  fetchTopics,
  BrandStats,
  Mention,
  TopicResult
} from "@/lib/api";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

interface VelocityPoint {
  hour: string;
  count: number;
}

function computeHourlyVelocity(mentions: Mention[]): VelocityPoint[] {
  const now = new Date();
  const buckets: Record<string, number> = {};

  // Create 24 hour buckets
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const label = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      hour12: true,
    });
    buckets[label] = 0;
  }

  // Fill buckets with mention counts
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  mentions.forEach((mention) => {
    const d = new Date(mention.publishedAt);
    if (d < cutoff || d > now) return;

    const hourKey = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      hour12: true,
    });
    if (hourKey in buckets) {
      buckets[hourKey] += 1;
    }
  });

  return Object.entries(buckets).map(([hour, count]) => ({ hour, count }));
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "indigo"
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorClasses = {
    indigo: "from-indigo-500/20 to-purple-500/10 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/20 to-pink-500/10 border-rose-500/20 text-rose-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400 font-medium">{title}</span>
        <Icon size={18} className={colorClasses[color].split(" ").pop()} />
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      {trend && (
        <div className="mt-2 text-xs text-slate-500">{trend}</div>
      )}
    </div>
  );
}

// Brand Selector for Analytics
function AnalyticsBrandSelector() {
  const { brands, selectedBrandId, selectedBrand, setSelectedBrandId, isLoading } = useBrand();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading brands...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-gradient-to-r from-slate-800/80 to-slate-800/40 hover:from-slate-700/80 hover:to-slate-700/40 border border-slate-700/50 rounded-xl px-5 py-3 text-sm font-medium transition-all shadow-lg min-w-[220px]"
      >
        {selectedBrand ? (
          <>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="flex-1 text-left text-slate-100">{selectedBrand.name}</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="flex-1 text-left text-slate-400">Select a Brand</span>
          </>
        )}
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          {brands.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No brands configured</div>
          ) : (
            brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => {
                  setSelectedBrandId(brand.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center justify-between ${brand.id === selectedBrandId
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-200"
                  }`}
              >
                <span className="font-medium">{brand.name}</span>
                <span className="text-xs text-slate-500">
                  {brand.mentionCount?.toLocaleString() ?? 0} mentions
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Topic Item
function TopicItem({ topic, index }: { topic: TopicResult; index: number }) {
  const sentimentColors = {
    positive: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    negative: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    neutral: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
          {index + 1}
        </span>
        <span className="font-medium text-slate-200">{topic.topic}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded-full text-xs border ${sentimentColors[topic.sentiment]}`}>
          {topic.sentiment}
        </span>
        <span className="text-sm text-slate-500">{topic.count} mentions</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { selectedBrandId, selectedBrand, isLoading: brandLoading } = useBrand();

  const [stats, setStats] = React.useState<BrandStats | null>(null);
  const [mentions, setMentions] = React.useState<Mention[]>([]);
  const [topics, setTopics] = React.useState<TopicResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Load data when brand changes
  const loadData = React.useCallback(async () => {
    if (!selectedBrandId) return;

    setIsLoading(true);
    try {
      const [statsData, mentionsData, topicsData] = await Promise.all([
        fetchBrandStats(selectedBrandId),
        fetchMentions({ brandId: selectedBrandId, limit: 100 }),
        fetchTopics(selectedBrandId),
      ]);

      setStats(statsData);
      setMentions(mentionsData?.data ?? []);
      setTopics(topicsData?.topics ?? []);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrandId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Compute chart data
  const velocityData = React.useMemo(() => computeHourlyVelocity(mentions), [mentions]);

  const sourceData = React.useMemo(() => {
    const counts = { reddit: 0, hn: 0, rss: 0 };
    mentions.forEach((m) => {
      if (m.source === "reddit") counts.reddit++;
      else if (m.source === "hn") counts.hn++;
      else if (m.source === "rss") counts.rss++;
    });
    return counts;
  }, [mentions]);

  const sentimentData = React.useMemo(() => ({
    positive: stats?.positiveMentions ?? 0,
    negative: stats?.negativeMentions ?? 0,
    neutral: stats?.neutralMentions ?? 0,
  }), [stats]);

  // No brand selected state
  if (brandLoading) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </main>
      </div>
    );
  }

  if (!selectedBrandId) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-indigo-400" />
              <h1 className="text-lg font-semibold">Analytics</h1>
            </div>
            <AnalyticsBrandSelector />
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">No Brand Selected</h2>
              <p className="text-slate-400 max-w-md">
                Please select a brand from the dropdown above to view analytics data.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-indigo-400" />
            <h1 className="text-lg font-semibold">Analytics</h1>
            {selectedBrand && (
              <span className="text-slate-500">•</span>
            )}
            {selectedBrand && (
              <span className="text-sm text-slate-400">{selectedBrand.name}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-sm transition-all"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <AnalyticsBrandSelector />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Mentions"
                  value={stats?.totalMentions?.toLocaleString() ?? 0}
                  icon={Activity}
                  trend="All time"
                  color="indigo"
                />
                <StatCard
                  title="Avg Sentiment"
                  value={`${stats?.avgSentiment ?? 0}%`}
                  icon={TrendingUp}
                  trend="Positive mentions ratio"
                  color="emerald"
                />
                <StatCard
                  title="Total Reach"
                  value={stats?.reach ? `${(stats.reach / 1000).toFixed(1)}K` : "0"}
                  icon={Users}
                  trend="Combined impressions"
                  color="amber"
                />
                <StatCard
                  title="Active Alerts"
                  value={stats?.activeCrises ?? 0}
                  icon={AlertTriangle}
                  trend={stats?.activeCrises ? "Needs attention" : "All clear"}
                  color="rose"
                />
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Sentiment Distribution */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-5 shadow-lg shadow-indigo-500/5 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Sentiment Distribution</h3>
                      <p className="text-xs text-slate-400">Breakdown of mention sentiments</p>
                    </div>
                    <Sparkles size={16} className="text-indigo-400" />
                  </div>
                  <SentimentPieChart data={sentimentData} className="h-48" />
                </div>

                {/* Mentions Over Time */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-5 shadow-lg shadow-purple-500/5 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Mentions Over Time</h3>
                      <p className="text-xs text-slate-400">Last 24 hours activity</p>
                    </div>
                    <Activity size={16} className="text-purple-400" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={velocityData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          interval={3}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: 12,
                            padding: "12px 16px",
                          }}
                          formatter={(value: number) => [`${value} mentions`, ""]}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Source Breakdown */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-5 shadow-lg shadow-amber-500/5 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Source Breakdown</h3>
                      <p className="text-xs text-slate-400">Mentions by platform</p>
                    </div>
                    <BarChart3 size={16} className="text-amber-400" />
                  </div>
                  <SourceBarChart data={sourceData} className="h-40" />
                </div>

                {/* Top Topics */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-5 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Trending Topics</h3>
                      <p className="text-xs text-slate-400">AI-extracted themes</p>
                    </div>
                    <Sparkles size={16} className="text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    {topics.length > 0 ? (
                      topics.slice(0, 5).map((topic, index) => (
                        <TopicItem key={topic.topic} topic={topic} index={index} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>No topics extracted yet</p>
                        <p className="text-xs mt-1">Topics will appear after AI analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
