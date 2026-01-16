"use client";

import * as React from "react";
import { ChevronDown, Play, Loader2, Search, Square, AlertTriangle, RefreshCw } from "lucide-react";
import { Brand, fetchAllBrands, triggerBrandScrape, isRateLimitError } from "@/lib/api";

interface BrandSelectorProps {
    selectedBrandId: string | null;
    onBrandChange: (brandId: string) => void;
    onScrapeComplete?: () => void;
}

export function BrandSelector({
    selectedBrandId,
    onBrandChange,
    onScrapeComplete,
}: BrandSelectorProps) {
    const [brands, setBrands] = React.useState<Brand[]>([]);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isScraping, setIsScraping] = React.useState(false);
    const [isMonitoring, setIsMonitoring] = React.useState(false);
    const [isRateLimited, setIsRateLimited] = React.useState(false);
    const [rateLimitMessage, setRateLimitMessage] = React.useState<string | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Load brands on mount
    React.useEffect(() => {
        async function loadBrands() {
            setIsLoading(true);
            setIsRateLimited(false);
            try {
                const data = await fetchAllBrands();
                setBrands(data);

                // Auto-select first brand if none selected
                if (data.length > 0 && !selectedBrandId) {
                    onBrandChange(data[0].id);
                }
            } catch (error) {
                if (isRateLimitError(error)) {
                    setIsRateLimited(true);
                    setRateLimitMessage(error.retryAfter);
                } else {
                    console.error('Failed to load brands:', error);
                }
            } finally {
                setIsLoading(false);
            }
        }
        loadBrands();
    }, []);

    // Close dropdown on outside click
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup abort controller on unmount
    React.useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const selectedBrand = brands.find((b) => b.id === selectedBrandId);

    const handleRetry = async () => {
        setIsLoading(true);
        setIsRateLimited(false);
        try {
            const data = await fetchAllBrands();
            setBrands(data);
            if (data.length > 0 && !selectedBrandId) {
                onBrandChange(data[0].id);
            }
        } catch (error) {
            if (isRateLimitError(error)) {
                setIsRateLimited(true);
                setRateLimitMessage(error.retryAfter);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartMonitoring = async () => {
        if (!selectedBrandId) return;

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setIsScraping(true);
        setIsMonitoring(true);

        try {
            await triggerBrandScrape(selectedBrandId);

            // Wait a bit for scrape to start, then refresh
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, 2000);

                // Listen for abort
                abortControllerRef.current?.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Monitoring stopped'));
                });
            });

            setIsScraping(false);
            onScrapeComplete?.();
        } catch (error) {
            if (isRateLimitError(error)) {
                setIsRateLimited(true);
                setRateLimitMessage(error.retryAfter);
            }
            console.log('Monitoring stopped or error:', error);
        } finally {
            setIsScraping(false);
            setIsMonitoring(false);
        }
    };

    const handleStopMonitoring = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsScraping(false);
        setIsMonitoring(false);
    };

    // Rate limited state
    if (isRateLimited) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-sm text-amber-400">
                        Rate limited. Retry in {rateLimitMessage || '15 minutes'}
                    </span>
                </div>
                <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-sm transition-all"
                >
                    <RefreshCw size={14} />
                    Retry
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading brands...</span>
            </div>
        );
    }

    if (brands.length === 0) {
        return (
            <div className="text-sm text-slate-500">
                No brands configured. Go to Configuration to add one.
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {/* Brand Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm font-medium transition-all min-w-[180px]"
                >
                    <Search size={14} className="text-slate-400" />
                    <span className="flex-1 text-left truncate">
                        {selectedBrand?.name ?? "Select Brand"}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        {brands.map((brand) => (
                            <button
                                key={brand.id}
                                onClick={() => {
                                    onBrandChange(brand.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${brand.id === selectedBrandId ? "bg-indigo-600/20 text-indigo-300" : "text-slate-200"
                                    }`}
                            >
                                <span className="font-medium">{brand.name}</span>
                                <span className="text-xs text-slate-500">
                                    {brand.mentionCount?.toLocaleString() ?? 0} mentions
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Start Monitoring Button */}
            <button
                onClick={handleStartMonitoring}
                disabled={!selectedBrandId || isScraping}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${isScraping
                    ? "bg-slate-700 text-slate-400 cursor-wait"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-600/20"
                    }`}
            >
                {isScraping ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Monitoring...</span>
                    </>
                ) : (
                    <>
                        <Play size={14} />
                        <span>Start Monitor</span>
                    </>
                )}
            </button>

            {/* Stop Monitoring Button */}
            <button
                onClick={handleStopMonitoring}
                disabled={!isMonitoring}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${isMonitoring
                        ? "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-600/20"
                        : "bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50"
                    }`}
            >
                <Square size={14} fill={isMonitoring ? "currentColor" : "none"} />
                <span>Stop</span>
            </button>
        </div>
    );
}
