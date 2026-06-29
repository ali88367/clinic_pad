"use client";

import * as React from "react";
import { Zap } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { getTemplates } from "@/lib/firestore-service";
import type { RxTemplate } from "@/lib/types";

interface TemplatePickerSheetProps {
  trigger: React.ReactNode;
  onPick: (template: RxTemplate) => void;
}

export function TemplatePickerSheet({ trigger, onPick }: TemplatePickerSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<RxTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o && user) {
      setLoading(true);
      getTemplates(user.uid)
        .then(setTemplates)
        .finally(() => setLoading(false));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetTitle>Template chunein</SheetTitle>
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-petrol-light/50" />
        ) : templates.length === 0 ? (
          <p className="py-6 text-center text-ink-muted">
            Koi template nahi hai. Pehle templates screen se banayein.
          </p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(t);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-petrol/40"
                >
                  <Zap className="size-4 shrink-0 text-gold" />
                  <div>
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-[12px] text-ink-muted">
                      {t.items.length} dawa{t.items.length === 1 ? "" : "yein"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
