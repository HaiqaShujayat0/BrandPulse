"use client";

import * as React from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";

interface SentimentData {
    positive: number;
    negative: number;
    neutral: number;
}

interface SentimentPieChartProps {
    data: SentimentData;
    className?: string;
}

const COLORS = {
    positive: "#10b981", // emerald-500
    negative: "#ef4444", // red-500
    neutral: "#6b7280",  // gray-500
};

const GRADIENT_COLORS = {
    positive: ["#10b981", "#34d399"],
    negative: ["#ef4444", "#f87171"],
    neutral: ["#6b7280", "#9ca3af"],
};

export function SentimentPieChart({ data, className }: SentimentPieChartProps) {
    const total = data.positive + data.negative + data.neutral;

    const chartData = [
        { name: "Positive", value: data.positive, color: COLORS.positive },
        { name: "Negative", value: data.negative, color: COLORS.negative },
        { name: "Neutral", value: data.neutral, color: COLORS.neutral },
    ].filter(item => item.value > 0);

    // Determine dominant sentiment
    let dominant = "neutral";
    let dominantPercent = 0;
    if (total > 0) {
        if (data.positive >= data.negative && data.positive >= data.neutral) {
            dominant = "positive";
            dominantPercent = Math.round((data.positive / total) * 100);
        } else if (data.negative >= data.positive && data.negative >= data.neutral) {
            dominant = "negative";
            dominantPercent = Math.round((data.negative / total) * 100);
        } else {
            dominant = "neutral";
            dominantPercent = Math.round((data.neutral / total) * 100);
        }
    }

    const dominantLabel = dominant.charAt(0).toUpperCase() + dominant.slice(1);

    if (total === 0) {
        return (
            <div className={className}>
                <div className="h-full flex items-center justify-center text-slate-500">
                    No sentiment data available
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                        </filter>
                    </defs>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                        style={{ filter: "url(#shadow)" }}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="transparent"
                                className="transition-all duration-300 hover:opacity-80"
                            />
                        ))}
                    </Pie>
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
                        formatter={(value: number, name: string) => [
                            `${value} mentions (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                            name,
                        ]}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                            <span className="text-sm text-slate-300">{value}</span>
                        )}
                    />
                    {/* Center Label */}
                    <text
                        x="50%"
                        y="45%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-100 text-2xl font-bold"
                    >
                        {dominantPercent}%
                    </text>
                    <text
                        x="50%"
                        y="55%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-400 text-xs"
                    >
                        {dominantLabel}
                    </text>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
