"use client";

import * as React from "react";
import type { Mention } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface PopularTopicsProps {
  mentions: Mention[];
  className?: string;
}

export function PopularTopics({ mentions, className }: PopularTopicsProps) {
  // Extract popular topics from mentions (mock implementation)
  const topics = React.useMemo(() => {
    const topicMap: Record<string, number> = {};
    
    mentions.forEach((mention) => {
      const words = mention.title.toLowerCase().split(/\s+/);
      const keywords = ["next.js", "typescript", "react", "api", "deployment", "pricing", "downtime", "feature"];
      
      keywords.forEach((keyword) => {
        if (mention.title.toLowerCase().includes(keyword)) {
          topicMap[keyword] = (topicMap[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(topicMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((topic) => ({
        ...topic,
        color: topic.tag.includes("next") || topic.tag.includes("typescript") || topic.tag.includes("react")
          ? "bg-indigo-500"
          : topic.tag.includes("downtime") || topic.tag.includes("error")
          ? "bg-red-500"
          : "bg-slate-600",
      }));
  }, [mentions]);

  const maxCount = topics.length > 0 ? Math.max(...topics.map(t => t.count)) : 1;

  return (
    <div className={cn("bg-slate-900 border border-slate-800 p-6 rounded-2xl", className)}>
      <h2 className="text-sm font-semibold text-slate-400 mb-4 tracking-widest uppercase">Popular Topics</h2>
      <div className="space-y-4">
        {topics.length === 0 ? (
          <p className="text-xs text-slate-500">No topics found</p>
        ) : (
          topics.map((topic, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">{topic.tag}</span>
                <span className="text-slate-500">{topic.count} mentions</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full", topic.color)}
                  style={{ width: `${(topic.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
