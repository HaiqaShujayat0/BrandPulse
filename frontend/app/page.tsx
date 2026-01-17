"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/dashboard");
        }, 2000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Grid Background - More visible */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Subtle radial fade at edges */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(15, 23, 42, 0.5) 80%)',
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
                <h1 className="text-lg md:text-xl font-medium tracking-[0.35em] text-slate-300 mb-4">
                    BRANDPULSE
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                    Redirecting to dashboard...
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-indigo-500/50 text-slate-300 text-sm font-medium rounded-lg transition-all duration-300"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
