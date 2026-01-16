"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Mention } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface TrendLineProps {
  mentions: Mention[];
  className?: string;
}

interface VelocityPoint {
  bucket: string;
  count: number;
}

function computeVelocity(mentions: Mention[]): VelocityPoint[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const buckets: Record<string, number> = {};

  for (let i = 0; i < 24; i++) {
    const labelDate = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const label = labelDate.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    buckets[label] = 0;
  }

  mentions.forEach((mention) => {
    const d = new Date(mention.publishedAt);
    if (d < cutoff || d > now) return;

    const hourKey = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      0,
      0,
      0
    ).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (!(hourKey in buckets)) {
      buckets[hourKey] = 0;
    }
    buckets[hourKey] += 1;
  });

  return Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));
}

export function TrendLine({ mentions, className }: TrendLineProps) {
  const data = React.useMemo(() => computeVelocity(mentions), [mentions]);

  return (
    <div className={cn("panel", className)}>
      <div className="panel-header">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Mention Velocity</h2>
          <p className="text-sm text-slate-400 mt-1">Last 24 hours</p>
        </div>
      </div>
      <div className="panel-body h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid
              stroke="#1e293b"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              interval={3}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              allowDecimals={false}
            />
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
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#6366f1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
