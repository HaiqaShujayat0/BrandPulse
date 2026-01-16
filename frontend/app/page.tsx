"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();

  React.useEffect(() => {
    // Auto-redirect to dashboard
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="mono text-sm uppercase tracking-[0.24em] text-muted-foreground">
          BrandPulse
        </span>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
