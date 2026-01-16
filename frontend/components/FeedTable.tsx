"use client";

import * as React from "react";
import type { Mention } from "@/lib/api";
import { MessageSquare, Rss, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeedTableProps {
  mentions: Mention[];
  isLoading?: boolean;
  className?: string;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  onPageChange?: (page: number) => void;
}

// Use stored sentiment from API, fallback to keyword-based calculation
const getSentiment = (mention: Mention): "positive" | "negative" | "neutral" => {
  // Prefer stored sentiment from backend (Gemini-analyzed)
  if (mention.sentiment) {
    return mention.sentiment;
  }

  // Fallback to simple keyword detection
  const text = `${mention.title} ${mention.content}`.toLowerCase();
  const positiveWords = ["great", "amazing", "excellent", "love", "best", "awesome", "fantastic", "perfect"];
  const negativeWords = ["bad", "terrible", "awful", "hate", "worst", "broken", "issue", "problem", "error"];

  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getSourceStyles = (source: string) => {
  switch (source) {
    case "reddit":
      return {
        label: "REDDIT",
        bg: "bg-gradient-to-br from-orange-500/20 to-orange-600/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
        icon: "text-orange-400",
      };
    case "hn":
      return {
        label: "HACKER NEWS",
        bg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: "text-amber-400",
      };
    case "rss":
      return {
        label: "GOOGLE NEWS",
        bg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
        border: "border-blue-500/30",
        text: "text-blue-400",
        icon: "text-blue-400",
      };
    default:
      return {
        label: source.toUpperCase(),
        bg: "bg-gradient-to-br from-slate-500/20 to-slate-600/10",
        border: "border-slate-500/30",
        text: "text-slate-400",
        icon: "text-slate-400",
      };
  }
};

const getSentimentStyles = (sentiment: "positive" | "negative" | "neutral") => {
  switch (sentiment) {
    case "positive":
      return {
        bg: "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10",
        border: "border-emerald-500/40",
        text: "text-emerald-400",
        icon: TrendingUp,
      };
    case "negative":
      return {
        bg: "bg-gradient-to-r from-rose-500/20 to-rose-600/10",
        border: "border-rose-500/40",
        text: "text-rose-400",
        icon: TrendingDown,
      };
    default:
      return {
        bg: "bg-gradient-to-r from-slate-500/20 to-slate-600/10",
        border: "border-slate-500/40",
        text: "text-slate-400",
        icon: Minus,
      };
  }
};

// Use stored author from API when available
const getAuthor = (mention: Mention): string => {
  if (mention.author) {
    return mention.author;
  }
  // Fallback based on source
  if (mention.source === "reddit") return "reddit_user";
  if (mention.source === "rss") return "news_source";
  return "hn_user";
};

export function FeedTable({ mentions, isLoading, className, pagination, onPageChange }: FeedTableProps) {
  const [activeTab, setActiveTab] = React.useState("all");

  const filteredMentions = React.useMemo(() => {
    if (activeTab === "all") return mentions;
    if (activeTab === "reddit") return mentions.filter(m => m.source === "reddit");
    if (activeTab === "news") return mentions.filter(m => m.source === "rss" || m.source === "hn");
    return mentions;
  }, [mentions, activeTab]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Real-time Mentions</h2>
        <div className="flex bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-1 shadow-lg">
          {[
            { id: "all", label: "All" },
            { id: "reddit", label: "Reddit" },
            { id: "news", label: "News" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredMentions.length === 0 && !isLoading ? (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl text-center">
            <p className="text-sm text-slate-500">No mentions found</p>
          </div>
        ) : (
          filteredMentions.map((mention) => {
            const sentiment = getSentiment(mention);
            const timeAgo = formatTimeAgo(mention.publishedAt);
            const author = getAuthor(mention);
            const sourceStyles = getSourceStyles(mention.source);
            const sentimentStyles = getSentimentStyles(sentiment);
            const SentimentIcon = sentimentStyles.icon;

            return (
              <div
                key={mention.id}
                className={cn(
                  "relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-xl transition-all duration-300 group hover:bg-slate-900/90 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50",
                  mention.isSpam && "opacity-60"
                )}
              >
                {/* Left color accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", sourceStyles.bg.replace("bg-gradient-to-br", "bg-gradient-to-b"))} />

                <div className="flex items-start gap-4 ml-2">
                  {/* Source icon */}
                  <div
                    className={cn(
                      "mt-1 p-2.5 rounded-xl border shadow-lg",
                      sourceStyles.bg,
                      sourceStyles.border
                    )}
                  >
                    {mention.source === "reddit" ? (
                      <MessageSquare size={18} className={sourceStyles.icon} />
                    ) : (
                      <Rss size={18} className={sourceStyles.icon} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn("text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-md", sourceStyles.bg, sourceStyles.text)}>
                        {sourceStyles.label}
                      </span>
                      <span className="text-slate-700">•</span>
                      <span className="text-xs text-slate-500">{timeAgo}</span>

                      {/* Sentiment badge */}
                      <span
                        className={cn(
                          "ml-auto flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase border",
                          sentimentStyles.bg,
                          sentimentStyles.border,
                          sentimentStyles.text
                        )}
                      >
                        <SentimentIcon size={12} />
                        {sentiment}
                      </span>
                    </div>

                    <h3
                      className="text-sm font-semibold mb-1.5 text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug cursor-pointer"
                      onClick={() => {
                        if (mention.url) {
                          window.open(mention.url, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      {mention.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">
                        by <span className="text-slate-400 font-medium">@{author}</span>
                      </span>
                      {mention.reach && mention.reach > 0 && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span className="text-slate-500">
                            {mention.reach.toLocaleString()} reach
                          </span>
                        </>
                      )}
                      {mention.relevanceScore && mention.relevanceScore > 0 && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span className="text-indigo-400/70 font-medium">
                            {mention.relevanceScore} keyword{mention.relevanceScore > 1 ? 's' : ''} matched
                          </span>
                        </>
                      )}
                    </div>

                    {mention.isSpam && (
                      <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Spam
                      </span>
                    )}
                  </div>

                  <button
                    className="p-2 text-slate-600 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-800/50"
                    onClick={() => {
                      if (mention.url) {
                        window.open(mention.url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {isLoading && filteredMentions.length === 0 && (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading mentions...</p>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-800">
            <div className="text-sm text-slate-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} mentions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage || isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-400 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pageNum === pagination.page
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                          : "text-slate-400 bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:text-slate-100"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-400 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
