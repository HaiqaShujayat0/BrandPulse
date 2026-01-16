"use client";

import * as React from "react";
import type { MentionSource } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SourceFilter = "all" | MentionSource;

export interface FilterState {
  hideSpam: boolean;
  source: SourceFilter;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface FilterBarProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  className?: string;
}

export function FilterBar({ value, onChange, className }: FilterBarProps) {
  const update = (patch: Partial<FilterState>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={cn("panel", className)}>
      <div className="panel-body">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search mentions by title or content..."
                value={value.search ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  update({ search: e.target.value })
                }
                className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-6">
            {/* Hide Spam Toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={value.hideSpam}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  update({ hideSpam: e.target.checked })
                }
              />
              <label className="text-sm font-medium text-slate-100 cursor-pointer">
                Hide Spam
              </label>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-400 whitespace-nowrap">
                Source:
              </label>
              <Select
                value={value.source}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  update({ source: e.target.value as SourceFilter })
                }
                className="bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20 w-40"
              >
                <option value="all">All Sources</option>
                <option value="reddit">Reddit</option>
                <option value="rss">RSS</option>
                <option value="hn">Hacker News</option>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-400 whitespace-nowrap">
                Date Range:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={value.fromDate ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    update({ fromDate: e.target.value })
                  }
                  className="bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20 w-40"
                />
                <span className="text-slate-500 text-sm">to</span>
                <Input
                  type="date"
                  value={value.toDate ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    update({ toDate: e.target.value })
                  }
                  className="bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20 w-40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
