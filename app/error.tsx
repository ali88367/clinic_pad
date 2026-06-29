"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-sm">
        <div className="flex items-baseline justify-center gap-1 mb-4">
          <span className="font-serif text-[28px] font-medium tracking-tight text-ink">Clinic</span>
          <span className="font-serif text-[28px] font-medium text-gold">Pad</span>
        </div>
        <h2 className="mb-2 text-lg font-medium text-ink">Kuch ghalat ho gaya</h2>
        <p className="mb-6 text-[14px] text-ink-muted">
          {error.message || "Aik unexpected error aa gayi. Dobara try karein."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Dobara try karein</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/patients")}>
            Dashboard par jayein
          </Button>
        </div>
      </div>
    </div>
  );
}
