"use client";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";

export default function PatientsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <div className="rounded-lg border border-danger/20 bg-danger-light p-6 text-center">
        <h2 className="mb-2 text-lg font-medium text-ink">Data load nahi ho saka</h2>
        <p className="mb-4 text-[14px] text-ink-muted">Connection check karein aur dobara try karein.</p>
        <Button onClick={reset}>Dobara try karein</Button>
      </div>
    </AppShell>
  );
}
