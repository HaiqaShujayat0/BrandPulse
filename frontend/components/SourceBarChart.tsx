"use client";

import * as React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface SourceData {
    reddit: number;
    hn: number;
    rss: number;
}

interface SourceBarChartProps {
    data: SourceData;
    className?: string;
}

const SOURCE_COLORS = {
    Reddit: "#ff4500",
    "Hacker News": "#ff6600",
    RSS: "#6366f1",
};

export function SourceBarChart({ data, className }: SourceBarChartProps) {
    const chartData = [
        { name: "Reddit", value: data.reddit, color: SOURCE_COLORS.Reddit },
        { name: "Hacker News", value: data.hn, color: SOURCE_COLORS["Hacker News"] },
        { name: "RSS", value: data.rss, color: SOURCE_COLORS.RSS },
    ];

    const total = data.reddit + data.hn + data.rss;

    if (total === 0) {
        return (
            <div className={className}>
                <div className="h-full flex items-center justify-center text-slate-500">
                    No source data available
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, bottom: 10, left: 80 }}
                >
                    <CartesianGrid
                        stroke="#1e293b"
                        strokeDasharray="3 3"
                        horizontal={false}
                    />
                    <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#e2e8f0", fontWeight: 500 }}
                        width={80}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: 12,
                            padding: "12px 16px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                        }}
                        itemStyle={{
                            fontSize: 14,
                            color: "#f1f5f9",
                            fontWeight: 500,
                        }}
                        formatter={(value: number) => [
                            `${value} mentions (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                            "",
                        ]}
                        cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                    />
                    <Bar
                        dataKey="value"
                        radius={[0, 6, 6, 0]}
                        animationDuration={800}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="transition-all duration-300"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
