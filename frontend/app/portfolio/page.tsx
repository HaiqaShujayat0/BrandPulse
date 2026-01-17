"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Briefcase,
    Search,
    Filter,
    Pencil,
    Trash2,
    Plus,
    X,
    Loader2,
    Tag,
    AlertTriangle,
    Save
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { fetchAllBrands, updateBrand, deleteBrand, Brand } from "@/lib/api";

// Edit Modal Component
function EditBrandModal({
    brand,
    isOpen,
    onClose,
    onSave,
}: {
    brand: Brand | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: { name: string; searchTerms: string[]; excludedTerms: string[] }) => Promise<void>;
}) {
    const [name, setName] = React.useState("");
    const [keywords, setKeywords] = React.useState("");
    const [excluded, setExcluded] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (brand) {
            setName(brand.name);

            // Helper to convert terms to comma-separated string
            const toCommaString = (terms: string | string[]): string => {
                if (Array.isArray(terms)) return terms.join(", ");
                try {
                    const parsed = JSON.parse(terms);
                    return Array.isArray(parsed) ? parsed.join(", ") : terms;
                } catch {
                    return terms || "";
                }
            };

            setKeywords(toCommaString(brand.searchTerms));
            setExcluded(toCommaString(brand.excludedTerms));
        }
    }, [brand]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brand) return;

        setIsSaving(true);
        await onSave(brand.id, {
            name,
            searchTerms: keywords.split(",").map((k) => k.trim()).filter(Boolean),
            excludedTerms: excluded.split(",").map((k) => k.trim()).filter(Boolean),
        });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen || !brand) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-slate-100">Edit Brand</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Brand Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            placeholder="Enter brand name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Keywords (comma separated)
                        </label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            placeholder="e.g., brand, product, company"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Excluded Keywords (comma separated)
                        </label>
                        <input
                            type="text"
                            value={excluded}
                            onChange={(e) => setExcluded(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            placeholder="e.g., competitor, spam"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
    brand,
    isOpen,
    onClose,
    onConfirm,
}: {
    brand: Brand | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: string) => Promise<void>;
}) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!brand) return;
        setIsDeleting(true);
        await onConfirm(brand.id);
        setIsDeleting(false);
        onClose();
    };

    if (!isOpen || !brand) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={24} className="text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Delete Brand</h2>
                        <p className="text-sm text-slate-400">This action cannot be undone</p>
                    </div>
                </div>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to delete <span className="font-semibold text-white">&quot;{brand.name}&quot;</span>?
                    All associated mentions will also be permanently deleted.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Trash2 size={18} />
                        )}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// Brand Card Component
function BrandCard({
    brand,
    onEdit,
    onDelete,
}: {
    brand: Brand;
    onEdit: (brand: Brand) => void;
    onDelete: (brand: Brand) => void;
}) {
    const parseTerms = (terms: string | string[]): string[] => {
        // If already an array, return it
        if (Array.isArray(terms)) return terms;
        // If string, try to parse as JSON
        try {
            const parsed = JSON.parse(terms);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return terms ? terms.split(",").map((t) => t.trim()) : [];
        }
    };

    const searchTerms = parseTerms(brand.searchTerms);
    const excludedTerms = parseTerms(brand.excludedTerms);

    return (
        <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                        {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-100">{brand.name}</h3>
                        <p className="text-sm text-slate-500">
                            {brand.mentionCount?.toLocaleString() ?? 0} mentions
                        </p>
                    </div>
                </div>

                {/* Action Buttons (visible on hover) */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(brand)}
                        className="p-2 bg-slate-700/50 hover:bg-indigo-600/50 border border-slate-600 hover:border-indigo-500 rounded-lg transition-all"
                        title="Edit brand"
                    >
                        <Pencil size={16} className="text-slate-300" />
                    </button>
                    <button
                        onClick={() => onDelete(brand)}
                        className="p-2 bg-slate-700/50 hover:bg-rose-600/50 border border-slate-600 hover:border-rose-500 rounded-lg transition-all"
                        title="Delete brand"
                    >
                        <Trash2 size={16} className="text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Keywords to Watch */}
            <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                    <Search size={12} />
                    Keywords to Watch
                </div>
                <div className="flex flex-wrap gap-2">
                    {searchTerms.length > 0 ? (
                        searchTerms.map((term, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm"
                            >
                                {term}
                            </span>
                        ))
                    ) : (
                        <span className="text-slate-500 text-sm italic">No keywords set</span>
                    )}
                </div>
            </div>

            {/* Excluded Keywords */}
            <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                    <Filter size={12} />
                    Excluded
                </div>
                <div className="flex flex-wrap gap-2">
                    {excludedTerms.length > 0 ? (
                        excludedTerms.map((term, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-slate-700/50 text-slate-400 border border-slate-600 rounded-full text-sm"
                            >
                                {term}
                            </span>
                        ))
                    ) : (
                        <span className="text-slate-500 text-sm italic">None</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PortfolioPage() {
    const router = useRouter();
    const [brands, setBrands] = React.useState<Brand[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
    const [deletingBrand, setDeletingBrand] = React.useState<Brand | null>(null);

    // Load brands
    React.useEffect(() => {
        async function loadBrands() {
            setIsLoading(true);
            const data = await fetchAllBrands();
            setBrands(data ?? []);
            setIsLoading(false);
        }
        loadBrands();
    }, []);

    // Handle save
    const handleSave = async (
        id: string,
        data: { name: string; searchTerms: string[]; excludedTerms: string[] }
    ) => {
        const updated = await updateBrand(id, data);
        if (updated) {
            setBrands((prev) =>
                prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
            );
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        const result = await deleteBrand(id);
        if (result) {
            setBrands((prev) => prev.filter((b) => b.id !== id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <Briefcase size={20} className="text-indigo-400" />
                        <div>
                            <h1 className="text-lg font-semibold">Brand Portfolio</h1>
                            <p className="text-xs text-slate-500">Manage and edit your monitored brands</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push("/config")}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30"
                    >
                        <Plus size={18} />
                        Add Brand
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                                <p className="text-slate-400">Loading brands...</p>
                            </div>
                        </div>
                    ) : brands.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                                    <Tag size={32} className="text-slate-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-100 mb-2">
                                    No Brands Yet
                                </h2>
                                <p className="text-slate-400 mb-4 max-w-md">
                                    Create your first brand to start monitoring conversations across the web.
                                </p>
                                <button
                                    onClick={() => router.push("/config")}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all"
                                >
                                    <Plus size={18} />
                                    Add Your First Brand
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                            {brands.map((brand) => (
                                <BrandCard
                                    key={brand.id}
                                    brand={brand}
                                    onEdit={setEditingBrand}
                                    onDelete={setDeletingBrand}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <EditBrandModal
                brand={editingBrand}
                isOpen={!!editingBrand}
                onClose={() => setEditingBrand(null)}
                onSave={handleSave}
            />
            <DeleteConfirmModal
                brand={deletingBrand}
                isOpen={!!deletingBrand}
                onClose={() => setDeletingBrand(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
