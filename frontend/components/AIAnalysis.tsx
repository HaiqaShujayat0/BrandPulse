"use client";

import * as React from "react";
import useSWR from "swr";
import { BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAIAnalysis, type AIAnalysisResponse } from "@/lib/api";

export interface AIAnalysisProps {
  brandId?: string | null;
  className?: string;
}

export function AIAnalysis({ brandId, className }: AIAnalysisProps) {
  const { data, error, isLoading, mutate } = useSWR<AIAnalysisResponse | null>(
    brandId ? ["analysis", brandId] : null,
    () => (brandId ? fetchAIAnalysis(brandId) : null),
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
    }
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  };

  if (!brandId) {
    return (
      <div className={cn("bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-2xl", className)}>
        <h2 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center gap-2">
          <BarChart3 size={14} />
          AI Analysis
        </h2>
        <p className="text-sm text-slate-500">Select a brand to view AI analysis</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BarChart3 size={80} />
      </div>

      <h2 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center gap-2">
        <RefreshCw
          size={14}
          className={isLoading ? "animate-spin" : "cursor-pointer hover:text-indigo-300"}
          onClick={() => mutate()}
        />
        AI Analysis
      </h2>

      {isLoading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          Generating analysis...
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">Failed to load analysis</p>
      ) : data?.analysis ? (
        <>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            "{data.analysis.summary}"
            {data.analysis.sentimentShift && (
              <span className={cn(
                "font-bold ml-1",
                data.analysis.sentimentShift.includes("positive") ? "text-emerald-400" :
                  data.analysis.sentimentShift.includes("negative") ? "text-red-400" : "text-slate-400"
              )}>
                ({data.analysis.sentimentShift})
              </span>
            )}
          </p>
          {data.analysis.topTopics.length > 0 && (
            <p className="text-xs text-slate-500 mb-3">
              Key topics: {data.analysis.topTopics.slice(0, 3).map((topic, i) => (
                <span key={i} className="underline decoration-indigo-500 underline-offset-4 mx-1">{topic}</span>
              ))}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
            Updated {formatTimeAgo(data.analysis.updatedAt)}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">No analysis available yet. Click refresh to generate.</p>
      )}
    </div>
  );
}
