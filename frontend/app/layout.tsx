import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/lib/BrandContext";

export const metadata: Metadata = {
  title: "BrandPulse Dashboard",
  description: "Real-time social listening platform that tracks brand mentions across Reddit, Google News, and Hacker News. Features intelligent keyword filtering, spam detection, relevance-based ranking, sentiment analysis (local + Gemini AI), and crisis detection."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <BrandProvider>
          {children}
        </BrandProvider>
      </body>
    </html>
  );
}
