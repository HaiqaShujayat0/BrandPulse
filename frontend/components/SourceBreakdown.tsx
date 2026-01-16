"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Mention, MentionSource } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface SourceBreakdownProps {
  mentions: Mention[];
  className?: string;
}

const COLORS: Record<MentionSource, string> = {
  reddit: "#FF4500",
  hn: "#FF6600",
  rss: "#6366F1",
};

const LABELS: Record<MentionSource, string> = {
  reddit: "Reddit",
  hn: "Hacker News",
  rss: "RSS",
};

export function SourceBreakdown({ mentions, className }: SourceBreakdownProps) {
  const data = React.useMemo(() => {
    const counts: Record<MentionSource, number> = {
      reddit: 0,
      hn: 0,
      rss: 0,
    };

    mentions.forEach((mention) => {
      counts[mention.source] = (counts[mention.source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([source, value]) => ({
        name: LABELS[source as MentionSource],
        value,
        color: COLORS[source as MentionSource],
      }))
      .filter((item) => item.value > 0);
  }, [mentions]);

  const total = mentions.length;

  return (
    <div className={cn("panel", className)}>
      <div className="panel-header">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Source Distribution</h2>
          <p className="text-sm text-slate-400 mt-1">
            {total.toLocaleString()} total mentions
          </p>
        </div>
      </div>
      <div className="panel-body h-80">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={90}
                fill="#94a3b8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
                labelStyle={{
                  fontSize: 12,
                  color: "#94a3b8",
                  marginBottom: 4,
                }}
                itemStyle={{
                  fontSize: 13,
                  color: "#f1f5f9",
                  fontWeight: 500,
                }}
                formatter={(value: number) => [`${value} mentions`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
