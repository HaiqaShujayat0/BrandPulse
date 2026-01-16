"use client";

import * as React from "react";
import { Brand, fetchAllBrands, isRateLimitError, RateLimitError } from "./api";

interface BrandContextType {
    brands: Brand[];
    selectedBrandId: string | null;
    selectedBrand: Brand | null;
    isLoading: boolean;
    isRateLimited: boolean;
    rateLimitRetryAfter: string | null;
    setSelectedBrandId: (id: string | null) => void;
    refreshBrands: () => Promise<void>;
}

const BrandContext = React.createContext<BrandContextType | undefined>(undefined);

const STORAGE_KEY = "brandpulse_selected_brand";

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const [brands, setBrands] = React.useState<Brand[]>([]);
    const [selectedBrandId, setSelectedBrandIdState] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRateLimited, setIsRateLimited] = React.useState(false);
    const [rateLimitRetryAfter, setRateLimitRetryAfter] = React.useState<string | null>(null);

    // Load brands and restore selection from localStorage
    const loadBrands = React.useCallback(async () => {
        setIsLoading(true);
        setIsRateLimited(false);
        setRateLimitRetryAfter(null);

        try {
            const data = await fetchAllBrands();
            setBrands(data);

            // Restore from localStorage or select first
            const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            if (stored && data.find((b) => b.id === stored)) {
                setSelectedBrandIdState(stored);
            } else if (data.length > 0) {
                setSelectedBrandIdState(data[0].id);
            }
        } catch (error) {
            if (isRateLimitError(error)) {
                setIsRateLimited(true);
                setRateLimitRetryAfter(error.retryAfter);
                console.warn('Rate limited:', error.message);
            } else {
                console.error('Failed to load brands:', error);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    const setSelectedBrandId = React.useCallback((id: string | null) => {
        setSelectedBrandIdState(id);
        if (typeof window !== "undefined") {
            if (id) {
                localStorage.setItem(STORAGE_KEY, id);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    const selectedBrand = React.useMemo(
        () => brands.find((b) => b.id === selectedBrandId) ?? null,
        [brands, selectedBrandId]
    );

    const value = React.useMemo(
        () => ({
            brands,
            selectedBrandId,
            selectedBrand,
            isLoading,
            isRateLimited,
            rateLimitRetryAfter,
            setSelectedBrandId,
            refreshBrands: loadBrands,
        }),
        [brands, selectedBrandId, selectedBrand, isLoading, isRateLimited, rateLimitRetryAfter, setSelectedBrandId, loadBrands]
    );

    return (
        <BrandContext.Provider value={value}>
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand() {
    const context = React.useContext(BrandContext);
    if (context === undefined) {
        throw new Error("useBrand must be used within a BrandProvider");
    }
    return context;
}
